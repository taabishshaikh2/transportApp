package com.company.transport_app.request;

public record DriverRequest(
        String fullName,
        String phone,
        String licenseNumber,
        String licenseExpiry,
        int age,
        int experienceYears,
        String address,
        String status,
        String vehicleId
) {
}
