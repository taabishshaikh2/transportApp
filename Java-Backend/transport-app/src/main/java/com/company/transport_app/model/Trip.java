package com.company.transport_app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "TRIP")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Trip {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "trip_id", unique = true)
    private String tripId;

    @Column(name = "vendor_name")
    private String vendorName;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "period_from")
    private LocalDate periodFrom;

    @Column(name = "period_to")
    private LocalDate periodTo;

    private String location;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;


    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_id")
    private UUID driver;

    // 💰 Financial Fields

    @Column(name = "trip_amount", precision = 10, scale = 2)
    private BigDecimal tripAmount;

    @Column(name = "rate_per_trip", precision = 10, scale = 2)
    private BigDecimal ratePerTrip;

    @Column(name = "extra_olt_hrs", precision = 10, scale = 2)
    private BigDecimal extraOltHrs;

    @Column(name = "extra_olt_amount", precision = 10, scale = 2)
    private BigDecimal extraOltAmount;

    @Column(name = "acc_monthly_pass", precision = 10, scale = 2)
    private BigDecimal accMonthlyPass;

    @Column(name = "transport_total", precision = 12, scale = 2)
    private BigDecimal transportTotal;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;


    @Column(name = "status")
    private String status;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

}
