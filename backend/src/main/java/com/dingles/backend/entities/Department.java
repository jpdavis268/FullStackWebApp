package com.dingles.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/**
 * Java representation of department table.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Entity
public class Department {
    @Id @Column(length = 32)
    public String departmentName;

    @Column(nullable = false)
    public int minAge;

    @Column(nullable = false)
    public boolean wicApproved;
}
