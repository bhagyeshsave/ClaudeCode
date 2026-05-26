package com.example.secureapi;

import com.example.secureapi.dto.LoginRequest;
import com.example.secureapi.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void register_validRequest_returns201WithTokens() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("testuser1");
        req.setEmail("testuser1@example.com");
        req.setPassword("Test@1234");
        req.setFirstName("Test");
        req.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.username").value("testuser1"));
    }

    @Test
    void register_weakPassword_returns422() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("testuser2");
        req.setEmail("testuser2@example.com");
        req.setPassword("weak");
        req.setFirstName("Test");
        req.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void login_invalidCredentials_returns401() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("nonexistent");
        req.setPassword("WrongPass@1");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void register_duplicateUsername_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("dupuser");
        req.setEmail("dupuser1@example.com");
        req.setPassword("Test@1234");
        req.setFirstName("Dup");
        req.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        req.setEmail("dupuser2@example.com");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }
}
