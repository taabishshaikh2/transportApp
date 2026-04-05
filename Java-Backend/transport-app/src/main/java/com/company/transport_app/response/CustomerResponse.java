package com.company.transport_app.response;

import org.springframework.http.HttpStatus;

import java.util.List;

public record CustomerResponse(
        String message,
        List<CustomerDTO> data,
        HttpStatus status
) {
}
