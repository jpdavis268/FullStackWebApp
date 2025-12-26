package com.dingles.backend.entities;

import jakarta.persistence.*;

/**
 * Java representation of member sale table.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Entity
public class MemberSale {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public long saleId;

    @Column(nullable = false)
    public float priceModifier;

    @Column(nullable = false)
    public int requiredAmount;

    @Column(length = 32)
    public String saleName;
}
