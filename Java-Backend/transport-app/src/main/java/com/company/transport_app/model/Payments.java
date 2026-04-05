package com.company.transport_app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "PAYMENTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Payments {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    @Column(name = "invoice_id")
    private UUID invoiceId;
    @Column(name = "payment_date", nullable = false)
    private Date paymentDate;
    @Column(name = "amount")
    private BigDecimal amount;
    @Column(name = "payment_mode")
    private String paymentMode;
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
    }
}
