package com.company.transport_app.response;

import org.springframework.http.HttpStatus;

import java.util.List;

public record DriverResponse(
        String message,
        List<DriverDTO> data,
        HttpStatus status
) {
}
