package com.dingles.backend.service;

import com.dingles.backend.entities.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Access interface for member table.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByPhoneNumberEquals(long phoneNumber);
}
