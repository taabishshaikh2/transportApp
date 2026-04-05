package com.company.transport_app.controller;

import com.company.transport_app.request.CustomerRequest;
import com.company.transport_app.response.CustomerResponse;
import com.company.transport_app.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
@Slf4j
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping("/create-customer")
    public ResponseEntity<CustomerResponse> createCustomer(@RequestBody CustomerRequest request) {
        log.debug("Request :: {}", request);
        return ResponseEntity.ok((CustomerResponse) customerService.create(request));
    }

    @GetMapping("/list-all-customers")
    public ResponseEntity<CustomerResponse> listAllCustomers() {
        return ResponseEntity.ok(customerService.list());
    }

    @GetMapping("/get-customer-by-id")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable("id") String id) {
        log.debug("Id :: {}", id);
        return ResponseEntity.ok(customerService.getOne(id));
    }

    @PutMapping("/update-customer-by-id")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable("id") String id, @RequestBody CustomerRequest request) {
        log.debug("Id :: {}", id);
        log.debug("Request :: {}", request);
        return ResponseEntity.ok(customerService.update(id, request));
    }
}
