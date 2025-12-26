package com.dingles.backend.entities;

import jakarta.persistence.*;

/**
 * Java representation of store member entity.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public long cardId;

    @Column(unique = true)
    public long phoneNumber;

    @Column(length = 16, nullable = false)
    public String firstName;

    @Column(length = 1)
    public String middleInitial;

    @Column(length = 16, nullable = false)
    public String lastName;

    @Column(length = 32)
    public String address;

    @Column(columnDefinition = "integer default -1")
    public Integer apartmentNumber;

    @Column(length = 32)
    public String city;

    @Column(length = 2)
    public String state;

    @Column(columnDefinition = "integer default -1")
    public Integer zip;

    @Column(length = 32)
    public String email;

    @Column(columnDefinition = "integer default 0")
    public int currentMonthFuelPoints;

    @Column(columnDefinition = "integer default 0")
    public int lastMonthFuelPoints;
}
