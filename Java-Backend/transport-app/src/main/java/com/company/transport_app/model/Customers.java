package com.company.transport_app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "CUSTOMERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Customers {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id")
    private UUID id;
    @Column(name = "customerid")
    private String customerId;
    @Column(name = "customername")
    private String customerName;
    @Column(name = "companyname")
    private String companyName;
    @Column(name = "phone")
    private String phone;
    @Column(name = "email")
    private String email;
    @Column(name = "city")
    private String city;
    @Column(name = "state")
    private String state;
    @Column(name = "address")
    private String address;
    @Column(name = "gstin")
    private String gstin;
    @Column(name = "dhlgstin")
    private String dhlgstin;
    @Column(name = "creditdays")
    private String creditDays;
    @Column(name = "openingbalance")
    private BigDecimal openingBalance;
    @Column(name = "createdate")
    private Date createdAt;
    @Column(name = "updatedate")
    private Date updatedAt;


}
