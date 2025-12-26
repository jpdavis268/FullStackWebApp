package com.dingles.backend.entities;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Java representation of store product entity.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Entity
public class Product {
    @Id
    public long id;

    @Column(length = 32, nullable = false)
    public String name;

    @Column(nullable = false)
    public BigDecimal price;

    @ManyToOne @JoinColumn(name = "department_name", nullable = false)
    private Department department;

    @Column(nullable = false)
    public int minAge;

    @Column(nullable = false)
    public boolean pricedByWeight;

    @OneToOne @JoinColumn(name = "sale_id")
    public MemberSale memberSale;
}
