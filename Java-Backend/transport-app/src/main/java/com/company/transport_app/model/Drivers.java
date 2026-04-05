package com.company.transport_app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "DRIVERS")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Getter
@Setter
public class Drivers {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @UuidGenerator
    @Column(name = "id")
    private UUID id;
    @Column(name = "fullname")
    private String fullName;
    @Column(name = "phone")
    private String phone;
    @Column(name = "licensenumber", unique = true)
    private String licenseNumber;
    @Column(name = "licenseexpiry")
    private Date licenseExpiry;
    @Column(name = "age")
    private Integer age;
    @Column(name = "experienceyears")
    private Integer experienceYears;
    @Column(name = "address")
    private String address;
    @Column(name = "status")
    private String status;
    @Column(name = "vehicleid")
    private UUID vehicleId;
    @Column(name = "userid")
    private UUID userId;
    @Column(name = "createdate")
    private Date createdDate;
    @Column(name = "updatedate")
    private Date updateDate;
}
