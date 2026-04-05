package com.company.transport_app.request;

public record RegisterRequest(
        String userName,
        String password,
        String fullName,
        String email

) {
}
