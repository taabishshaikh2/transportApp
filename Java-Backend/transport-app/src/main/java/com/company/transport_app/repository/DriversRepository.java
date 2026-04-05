package com.company.transport_app.repository;

import com.company.transport_app.model.Drivers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DriversRepository extends JpaRepository<Drivers, UUID> {
}
