package com.dingles.backend.controller;

import com.dingles.backend.entities.Member;
import com.dingles.backend.entities.Product;
import com.dingles.backend.service.DatabaseAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Process and handle incoming HTTP requests.
 *
 * @author Pierce Davis
 * @version 1.0.0
 */
@RestController
@RequestMapping("/database")
@CrossOrigin
public class IOController {
    @Autowired
    private DatabaseAccessor accessor;

    /**
     * Try to add a new member to the database.
     *
     * @param toAdd Member to add.
     * @return Result string.
     */
    @PostMapping("/addMember")
    public String addMember(@RequestBody Member toAdd) {
        return accessor.saveMember(toAdd);
    }

    /**
     * Add points to a member's current month fuel points collection.
     *
     * @param id ID of member.
     * @param points Points to give.
     * @return Result message.
     */
    @PostMapping("/givePoints/{id}/{points}")
    public String addFuelPoints(@PathVariable String id, @PathVariable String points) {
        try {
            long idNumber = Long.parseLong(id);
            int pointNumber = Integer.parseInt(points);
            return accessor.giveFuelPoints(idNumber, pointNumber);
        }
        catch (NumberFormatException e) {
            return "Error: provided id or point amount is not a number.";
        }
    }

    /**
     * Attempt to withdraw points from a member's collection.
     *
     * @param id ID of member.
     * @param points Points to attempt to withdraw.
     * @return How many points could be withdrawn, or -1 if an error occurs.
     */
    @PostMapping("/withdrawPoints/{id}/{points}")
    public int withdrawFuelPoints(@PathVariable String id, @PathVariable String points) {
        try {
            long idNumber = Long.parseLong(id);
            int pointNumber = Integer.parseInt(points);
            return accessor.withdrawFuelPoints(idNumber, pointNumber);
        }
        catch (NumberFormatException e) {
            return -1;
        }
    }

    /**
     * Attempt to get a store member using their card ID.
     *
     * @param id ID of member card.
     * @return Member, or null if no member was found.
     */
    @GetMapping("/getMember/{id}")
    public Member getMember(@PathVariable String id) {
        try {
            long idNumber = Long.parseLong(id);
            return accessor.getMemberByID(idNumber).orElse(null);
        }
        catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Attempt to get a store member using their phone number.
     *
     * @param phoneNumber Phone number associated with member card.
     * @return Member, or null if no member was found.
     */
    @GetMapping("/getMemberByPhone/{phoneNumber}")
    public Member getMemberByPhone(@PathVariable String phoneNumber) {
        try {
            long number = Long.parseLong(phoneNumber);
            return accessor.getMemberByPhone(number).orElse(null);
        }
        catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Attempt to fetch an item.
     *
     * @param itemID ID Of item.
     * @return Product entity retrieved, or null if it was not found.
     */
    @GetMapping("/getItem/{itemID}")
    public Product getItem(@PathVariable String itemID) {
        try {
            long idNumber = Long.parseLong(itemID);
            return accessor.getItem(idNumber).orElse(null);
        }
        catch (NumberFormatException e) {
            return null;
        }
    }
}
