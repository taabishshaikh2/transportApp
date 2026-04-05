package com.company.transport_app.response;

public record CustomerDTO(
        Long id,
        String email,
        String companyName,
        String contactPerson,
        String phone,
        Double totalBilled,
        Double totalPaid,
        Double outstanding
) {
}
