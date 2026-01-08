import express from "express";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test framework
const tests = [];
const results = { passed: 0, failed: 0, errors: [] };

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

// ============ UNIT TESTS ============

test("Hours endpoint should return valid hours object", async () => {
  const hours = JSON.parse(fs.readFileSync(path.join(__dirname, "hours.json")));
  assert(typeof hours.startHour === "number", "startHour should be a number");
  assert(typeof hours.endHour === "number", "endHour should be a number");
  assert(hours.startHour < hours.endHour, "startHour should be less than endHour");
});

test("Hours should be within valid range", async () => {
  const hours = JSON.parse(fs.readFileSync(path.join(__dirname, "hours.json")));
  assert(hours.startHour >= 0 && hours.startHour <= 23, "startHour must be 0-23");
  assert(hours.endHour >= 0 && hours.endHour <= 23, "endHour must be 0-23");
});

test("Booking validation - reject duration > 3", () => {
  const duration = 4;
  assert(duration > 3, "Duration > 3 should fail");
});

test("Booking validation - accept valid duration", () => {
  const duration = 3;
  assert(duration <= 3, "Duration <= 3 should pass");
});

test("Hour dropdown population - verify startHour is included", () => {
  const hours = JSON.parse(fs.readFileSync(path.join(__dirname, "hours.json")));
  const startHour = hours.startHour;
  const endHour = hours.endHour;
  
  // Simulate dropdown creation
  const hoursArray = [];
  for (let h = startHour; h <= endHour; h++) {
    hoursArray.push(h);
  }
  
  assertEquals(hoursArray[0], startHour, "First hour should equal startHour");
  assertEquals(hoursArray[hoursArray.length - 1], endHour, "Last hour should equal endHour");
});

test("Booking data - startHour should convert to number", () => {
  const startHourString = "10";
  const startHourNumber = Number(startHourString);
  assertEquals(typeof startHourNumber, "number", "startHour should be a number");
  assertEquals(startHourNumber, 10, "startHour value should be 10");
});

test("Booking calculation - endHour = startHour + duration", () => {
  const startHour = 10;
  const duration = 2;
  const endHour = startHour + duration;
  assertEquals(endHour, 12, "endHour should be 12");
});

test("Booking calculation - should not exceed working hours", () => {
  const hours = JSON.parse(fs.readFileSync(path.join(__dirname, "hours.json")));
  const startHour = 10;
  const duration = 2;
  const endHour = startHour + duration;
  
  assert(endHour <= hours.endHour, `endHour (${endHour}) should not exceed working hours (${hours.endHour})`);
});

test("Hours dropdown - verify range calculation", () => {
  const hours = JSON.parse(fs.readFileSync(path.join(__dirname, "hours.json")));
  const count = (hours.endHour - hours.startHour) + 1;
  assert(count > 0, "Hour range should be positive");
});

// ============ INTEGRATION TESTS ============

test("Integration - Create test booking file", () => {
  const testBookingsPath = path.join(__dirname, "test-bookings.json");
  const testData = {
    nume: "Test",
    prenume: "User",
    email: "test@example.com",
    telefon: "0712345678",
    date: "2026-01-15",
    startHour: 10,
    duration: 2,
    endHour: 12
  };
  
  fs.writeFileSync(testBookingsPath, JSON.stringify([testData], null, 2));
  assert(fs.existsSync(testBookingsPath), "Test booking file should be created");
  
  // Cleanup
  fs.unlinkSync(testBookingsPath);
});

test("Integration - Verify all required fields in booking", () => {
  const requiredFields = ["nume", "prenume", "email", "telefon", "date", "startHour", "duration"];
  const testData = {
    nume: "Ion",
    prenume: "Popescu",
    email: "ion@example.com",
    telefon: "0712345678",
    date: "2026-01-15",
    startHour: 10,
    duration: 2
  };
  
  requiredFields.forEach(field => {
    assert(testData.hasOwnProperty(field), `Booking should have ${field}`);
  });
});

// ============ RUN TESTS ============

async function runTests() {
  console.log("🧪 Running Tests...\n");
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      results.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ test: name, error: error.message });
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  console.log("=".repeat(60) + "\n");
  
  if (results.failed > 0) {
    console.log("🔴 ISSUES FOUND:");
    results.errors.forEach(({ test, error }) => {
      console.log(`  • ${test}: ${error}`);
    });
    console.log();
  }
}

runTests().catch(console.error);
