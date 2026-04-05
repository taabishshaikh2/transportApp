package com.company.transport_app.service;

import com.company.transport_app.model.Customers;
import com.company.transport_app.repository.CustomersRepository;
import com.company.transport_app.request.CustomerRequest;
import com.company.transport_app.response.CustomerDTO;
import com.company.transport_app.response.CustomerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomersRepository customersRepository;

    @Override
    public CustomerResponse create(CustomerRequest request) {

        if (request == null || request.customerName() == null || request.companyName() == null
                || request.creditDays() == null || request.deliveryGstin() == null
                || request.openingBalance() == null || request.gstin() == null
                || request.city() == null || request.state() == null || request.address() == null
                || request.email() == null) {
            return new CustomerResponse("", null, HttpStatus.BAD_REQUEST);
        }

        if (customersRepository.existsByEmail(request.email())) {
            log.error("Customer Already Exist");
            return new CustomerResponse("", null, HttpStatus.CONFLICT);
        }

        Customers customers = Customers
                .builder()
                .email(request.email())
                .customerName(request.customerName())
                .companyName(request.companyName())
                .createdAt(new Date())
                .address(request.address())
                .phone(request.phone())
                .dhlgstin(request.deliveryGstin())
                .city(request.city())
                .state(request.state())
                .openingBalance(new BigDecimal(request.openingBalance()))
                .creditDays(request.creditDays())
                .build();

        customersRepository.save(customers);

        CustomerDTO data = new
                CustomerDTO(1L,
                customers.getEmail(),
                customers.getCompanyName(),
                customers.getCustomerName(),
                customers.getPhone(), 0.0, 0.0, 0.0);

        return new CustomerResponse("", List.of(data), HttpStatus.OK);
    }

    @Override
    public CustomerResponse list() {
        List<Customers> customersList = customersRepository.findAll();
        return new CustomerResponse(
                "",
                customersList.stream().map(this::mapToCustomers).toList()
                , HttpStatus.OK);
    }

    @Override
    public CustomerResponse getOne(String id) {
        if (id == null || id.isBlank()) return new CustomerResponse("", null, HttpStatus.BAD_REQUEST);
        Customers customers = customersRepository.findById(UUID.fromString(id)).orElse(null);
        return customers == null
                ? new CustomerResponse("", null, HttpStatus.OK)
                : new CustomerResponse("", List.of(mapToCustomers(customers)), HttpStatus.OK);
    }

    @Override
    public CustomerResponse update(String id, CustomerRequest request) {
        return null;
    }

    private CustomerDTO mapToCustomers(Customers customers) {
        return new CustomerDTO(
                0L,
                customers.getEmail(),
                customers.getCompanyName(),
                customers.getCustomerId(),
                customers.getPhone(), 0.0, 0.0, 0.0
        );
    }
}
