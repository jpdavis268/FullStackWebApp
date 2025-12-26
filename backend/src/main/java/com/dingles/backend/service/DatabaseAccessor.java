package com.dingles.backend.service;

import com.dingles.backend.entities.Member;
import com.dingles.backend.entities.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Handles access to the tables on the MySQL database.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@Service
public class DatabaseAccessor {
    @Autowired private MemberRepository memberRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    /**
     * Save a member to the database.
     *
     * @param member Member entity to save.
     * @return Result message.
     */
    public String saveMember(Member member) {
        String statement = "{CALL add_member(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";

        try {
            jdbcTemplate.update(
                    statement,
                    member.firstName,
                    member.lastName,
                    member.middleInitial,
                    member.phoneNumber,
                    member.email,
                    member.address,
                    member.city,
                    member.state,
                    member.zip,
                    member.apartmentNumber
            );
            return "Member added successfully.";
        }
        catch (DataAccessException e) {
            Throwable rootCause = e.getRootCause();
            if (rootCause instanceof SQLException sqlE) {
                return sqlE.getMessage();
            }
            return "Could not enter member data due to an unknown error.";
        }
    }

    /**
     * Add fuel points to a member's collection for the current month.
     *
     * @param memberID Member to give fuel points.
     * @param points Points to give member.
     * @return Result message.
     */
    public String giveFuelPoints(long memberID, int points) {
        try {
            jdbcTemplate.update("{CALL give_fuel_points(?, ?)}", memberID, points);
            return String.format("Gave %d %d points.", memberID, points);
        }
        catch (DataAccessException e) {
            Throwable rootCause = e.getRootCause();
            if (rootCause instanceof SQLException sqlE) {
                return sqlE.getMessage();
            }
            return "Could not give member fuel points due to an unknown error.";
        }
    }

    /**
     * Attempt to withdraw a selected number of fuel points from a member's collection.
     *
     * @param memberID ID of member.
     * @param amount Amount to attempt to withdraw.
     * @return Withdrawn amount (lesser of passed in amount or total quantity) or -1 if an error occurs.
     */
    public int withdrawFuelPoints(long memberID, int amount) {
        SimpleJdbcCall simpleJdbcCall = new SimpleJdbcCall(jdbcTemplate).withProcedureName("withdraw_fuel_points");
        try {
            Integer withdrawn = simpleJdbcCall.executeObject(Integer.class, memberID, amount);
            return Objects.requireNonNullElse(withdrawn, -1);
        }
        catch (DataAccessException e) {
            return -1;
        }
    }

    /**
     * Look up a store member using their card ID.
     *
     * @param id Card ID.
     * @return Member if found, or null if no member with the provided ID exists.
     */
    public Optional<Member> getMemberByID(long id) {
        return memberRepository.findById(id);
    }

    /**
     * Attempt to look up a store member by phone number.
     *
     * @param phoneNumber Phone number of member.
     * @return Member if found, or null if the number produced no results.
     */
    public Optional<Member> getMemberByPhone(long phoneNumber) {
        List<Member> matches = memberRepository.findByPhoneNumberEquals(phoneNumber);
        return Optional.ofNullable(matches.isEmpty() ? null : matches.getFirst());
    }

    /**
     * Get an item using its ID
     *
     * @param itemID ID of item.
     * @return Item fetched, or null if it was not found.
     */
    public Optional<Product> getItem(long itemID) {
        return productRepository.findById(itemID);
    }
}
