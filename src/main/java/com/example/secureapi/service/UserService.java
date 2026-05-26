package com.example.secureapi.service;

import com.example.secureapi.dto.*;
import com.example.secureapi.entity.User;
import com.example.secureapi.exception.ConflictException;
import com.example.secureapi.exception.UserNotFoundException;
import com.example.secureapi.repository.UserRepository;
import com.example.secureapi.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(User.Role.USER)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: {}", saved.getUsername());

        String accessToken = jwtUtils.generateAccessToken(saved);
        String refreshToken = jwtUtils.generateRefreshToken(saved);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getAccessTokenExpirationMs() / 1000)
                .user(UserResponse.from(saved))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = (User) auth.getPrincipal();
        String accessToken = jwtUtils.generateAccessToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(user);

        log.info("User logged in: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getAccessTokenExpirationMs() / 1000)
                .user(UserResponse.from(user))
                .build();
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtUtils.validateToken(token) || !jwtUtils.isRefreshToken(token)) {
            throw new SecurityException("Invalid or expired refresh token");
        }

        String username = jwtUtils.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String newAccessToken = jwtUtils.generateAccessToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getAccessTokenExpirationMs() / 1000)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        return UserResponse.from(findUserById(id));
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, String currentUsername) {
        User user = findUserById(id);
        assertOwnerOrAdmin(user, currentUsername);

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already in use");
            }
            user.setEmail(request.getEmail().toLowerCase());
        }

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id, String currentUsername) {
        User user = findUserById(id);
        assertOwnerOrAdmin(user, currentUsername);
        userRepository.delete(user);
        log.info("User deleted: {}", user.getUsername());
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
    }

    private void assertOwnerOrAdmin(User target, String currentUsername) {
        if (target.getUsername().equals(currentUsername)) return;
        userRepository.findByUsername(currentUsername).ifPresent(caller -> {
            if (caller.getRole() != User.Role.ADMIN) {
                throw new SecurityException("Access denied");
            }
        });
    }
}
