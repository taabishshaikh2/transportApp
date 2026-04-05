package com.company.transport_app.service;

import com.company.transport_app.model.Drivers;
import com.company.transport_app.repository.DriversRepository;
import com.company.transport_app.request.DriverRequest;
import com.company.transport_app.response.DriverDTO;
import com.company.transport_app.response.DriverResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverServiceImpl implements DriversService {

    private final DriversRepository driversRepository;

    @Override
    public DriverResponse create(DriverRequest req) {
        if (req == null || req.fullName() == null || req.address() == null ||
                req.phone() == null || req.status() == null || req.licenseNumber() == null ||
                req.licenseExpiry() == null || req.vehicleId() == null) {
            return new DriverResponse("", null, HttpStatus.BAD_REQUEST);
        }
        Drivers drivers = Drivers
                .builder()
                .fullName(req.fullName())
                .status(req.status())
                .age(req.age())
                .licenseNumber(req.licenseNumber())
                .licenseExpiry(new Date()) // TODO : change this date
                .vehicleId(UUID.fromString(req.vehicleId()))
                .experienceYears(req.experienceYears())
                .build();

        driversRepository.save(drivers);

        return new DriverResponse("", List.of(mapToDriverDTO(drivers)), HttpStatus.OK);
    }

    private DriverDTO mapToDriverDTO(Drivers drivers) {
        return new DriverDTO(); // TODO : add response
    }

    @Override
    public DriverResponse list() {
        List<Drivers> drivers = driversRepository.findAll();
        if (drivers.isEmpty()) return new DriverResponse("", null, HttpStatus.OK);
        return new DriverResponse("", drivers.stream().map(this::mapToDriverDTO).toList(), HttpStatus.OK);
    }

    @Override
    public DriverResponse update(String id, DriverRequest req) {
        return null;
    }

    @Override
    public DriverResponse getOne(String id) {
        Optional<Drivers> driver = driversRepository.findById(UUID.fromString(id));
        return driver.map(drivers -> new DriverResponse("", List.of(mapToDriverDTO(drivers)), HttpStatus.OK)).orElseGet(() -> new DriverResponse("", null, HttpStatus.OK));
    }
}
