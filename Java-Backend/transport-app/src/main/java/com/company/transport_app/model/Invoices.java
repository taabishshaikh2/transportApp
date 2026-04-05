package com.company.transport_app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "INVOICES")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Getter
@Setter
public class Invoices {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "invoice_number", unique = true)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "customer_id", nullable = false)
    private UUID customer;

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    private String invoicedTo;

    @Column(columnDefinition = "TEXT")
    private String address;

    private LocalDate periodFrom;
    private LocalDate periodTo;

    private String location;

    private String dhlGstin;

    private String sacNo;

    private String state;

    private String stateCode;

    private String placeOfSupply;

    private String vehicleTypeDesc;

    private String invoiceMonth;

    private String freightDesc;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal baseAmount;

    @Column(precision = 5, scale = 2)
    private BigDecimal cgstRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal sgstRate;

    @Column(precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(precision = 6, scale = 2)
    private BigDecimal roundOff;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String amountInWords;

    private String status;

    private LocalDate paymentDate;

    private String paymentMode;

    @Column(columnDefinition = "TEXT")
    private String notes;


    @Column(name = "created_by")
    private UUID createdBy;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;


    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        calculateAmounts();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
        calculateAmounts();
    }

    // 💡 Business Logic (Auto GST Calculation)

    public void calculateAmounts() {
        if (baseAmount == null) baseAmount = BigDecimal.ZERO;

        BigDecimal hundred = BigDecimal.valueOf(100);

        this.cgstAmount = baseAmount.multiply(cgstRate).divide(hundred);
        this.sgstAmount = baseAmount.multiply(sgstRate).divide(hundred);

        this.totalAmount = baseAmount
                .add(cgstAmount)
                .add(sgstAmount)
                .add(roundOff != null ? roundOff : BigDecimal.ZERO);
    }
}
