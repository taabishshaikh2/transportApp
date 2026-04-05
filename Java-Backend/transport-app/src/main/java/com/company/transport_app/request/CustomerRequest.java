package com.company.transport_app.request;

public record CustomerRequest(
        String companyName,
        String phone,
        String email,
        String customerName,
        String city,
        String state,
        String address,
        String gstin,
        String deliveryGstin,
        String creditDays,
        String openingBalance
) {
}
