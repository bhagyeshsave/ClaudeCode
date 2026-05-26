package com.example.secureapi.controller;

import com.example.secureapi.dto.UpdateUserRequest;
import com.example.secureapi.dto.UserResponse;
import com.example.secureapi.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        // Load by username — avoid exposing internal ID via path until authenticated
        return ResponseEntity.ok(userService.getUser(
                ((com.example.secureapi.entity.User) userDetails).getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #userDetails.username == @userRepository.findById(#id).map(u -> u.username).orElse('')")
    ResponseEntity<UserResponse> getUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<Page<UserResponse>> listUsers(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(userService.listUsers(pageable));
    }

    @PatchMapping("/{id}")
    ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.updateUser(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUser(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
