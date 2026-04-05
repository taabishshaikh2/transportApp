package com.company.transport_app.repository;

import com.company.transport_app.model.Customers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CustomersRepository extends JpaRepository<Customers, UUID> {
    boolean existsByEmail(String email);
}
