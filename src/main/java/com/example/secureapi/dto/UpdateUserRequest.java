package com.example.secureapi.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(min = 1, max = 50)
    @Pattern(regexp = "^[\\p{L} '-]+$", message = "First name contains invalid characters")
    private String firstName;

    @Size(min = 1, max = 50)
    @Pattern(regexp = "^[\\p{L} '-]+$", message = "Last name contains invalid characters")
    private String lastName;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format (E.164)")
    private String phoneNumber;
}
