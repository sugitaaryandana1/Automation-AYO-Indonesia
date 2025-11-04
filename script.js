function runAutomationTest() {
  var ss = SpreadsheetApp.openById(
    "1r3auC7p6bJxYz5TBiy1rIxAHzaj9Y2jznSpr4C4Vmgo"
  );

  // Initialize test report
  var testReport = [];
  testReport.push(
    "================================================================================"
  );
  testReport.push("                    AUTOMATION TEST REPORT");
  testReport.push("                    QA TESTER - BOOKING VALIDATION");
  testReport.push(
    "================================================================================"
  );
  testReport.push("");
  testReport.push("Test Date: " + new Date().toLocaleString());
  testReport.push("Tested By: QA Automation Script");
  testReport.push("");

  // Get test data
  var bookingSheet = ss.getSheetByName("booking");
  var scheduleSheet = ss.getSheetByName("schedule");

  if (!bookingSheet || !scheduleSheet) {
    Logger.log("ERROR: Sheet 'booking' atau 'schedule' tidak ditemukan!");
    return;
  }

  var bookingData = bookingSheet.getDataRange().getValues();
  var scheduleData = scheduleSheet.getDataRange().getValues();

  var totalTests = 0;
  var passedTests = 0;
  var failedTests = 0;

  // ========================================
  // TEST CASE 1: DOUBLE BOOKING DETECTION
  // ========================================
  testReport.push(
    "--------------------------------------------------------------------------------"
  );
  testReport.push("TEST CASE 1: DETEKSI DOUBLE BOOKING");
  testReport.push(
    "--------------------------------------------------------------------------------"
  );
  testReport.push("Test ID: TC_BOOKING_001");
  testReport.push(
    "Objective: Memastikan tidak ada double booking pada venue, tanggal, dan waktu yang sama"
  );
  testReport.push("Priority: HIGH");
  testReport.push("");

  totalTests++;
  var doubleBookingFound = false;
  var doubleBookingDetails = [];

  // Test execution
  for (var i = 1; i < bookingData.length; i++) {
    for (var j = i + 1; j < bookingData.length; j++) {
      var b1 = bookingData[i];
      var b2 = bookingData[j];

      // Check if double booking exists
      if (
        b1[2] == b2[2] && // venue_id sama
        formatDate(b1[4]) == formatDate(b2[4]) && // date sama
        formatTime(b1[5]) < formatTime(b2[6]) && // overlap check
        formatTime(b1[6]) > formatTime(b2[5])
      ) {
        doubleBookingFound = true;
        doubleBookingDetails.push({
          id1: b1[0],
          code1: b1[1],
          id2: b2[0],
          code2: b2[1],
          venue: b1[2],
          date: formatDate(b1[4]),
          time: formatTime(b1[5]) + " - " + formatTime(b1[6]),
        });
      }
    }
  }

  // Test result
  if (doubleBookingFound) {
    testReport.push("Test Result: FAILED");
    testReport.push("Reason: Double booking detected");
    testReport.push("");
    testReport.push("Bug Details:");
    for (var k = 0; k < doubleBookingDetails.length; k++) {
      var db = doubleBookingDetails[k];
      testReport.push(
        "  - Booking ID " +
          db.id1 +
          " (" +
          db.code1 +
          ") dan ID " +
          db.id2 +
          " (" +
          db.code2 +
          ")"
      );
      testReport.push(
        "    Venue: " + db.venue + ", Date: " + db.date + ", Time: " + db.time
      );
      testReport.push("    Status: BENTROK (DOUBLE BOOKING)");
    }
    failedTests++;
  } else {
    testReport.push("Test Result: PASSED");
    testReport.push("No double booking found");
    passedTests++;
  }

  testReport.push("");

  // ========================================
  // TEST CASE 2: PRICE VALIDATION
  // ========================================
  testReport.push(
    "--------------------------------------------------------------------------------"
  );
  testReport.push("TEST CASE 2: VALIDASI HARGA BOOKING");
  testReport.push(
    "--------------------------------------------------------------------------------"
  );
  testReport.push("Test ID: TC_BOOKING_002");
  testReport.push(
    "Objective: Memastikan harga booking sesuai dengan harga di schedule"
  );
  testReport.push("Priority: HIGH");
  testReport.push("");

  totalTests++;
  var invalidPriceFound = false;
  var invalidPriceDetails = [];

  // Test execution
  for (var i = 1; i < bookingData.length; i++) {
    var booking = bookingData[i];
    var bookingId = booking[0];
    var bookingCode = booking[1];
    var venueId = booking[2];
    var bookingDate = formatDate(booking[4]);
    var startTime = formatTime(booking[5]);
    var endTime = formatTime(booking[6]);
    var bookingPrice = booking[7];

    var correctPrice = null;

    // Find matching schedule
    for (var j = 1; j < scheduleData.length; j++) {
      var schedule = scheduleData[j];

      if (
        venueId == schedule[1] &&
        bookingDate == formatDate(schedule[2]) &&
        startTime == formatTime(schedule[3]) &&
        endTime == formatTime(schedule[4])
      ) {
        correctPrice = schedule[5];
        break;
      }
    }

    // Validate price
    if (correctPrice != null && bookingPrice != correctPrice) {
      invalidPriceFound = true;
      invalidPriceDetails.push({
        id: bookingId,
        code: bookingCode,
        bookingPrice: bookingPrice,
        correctPrice: correctPrice,
        difference: bookingPrice - correctPrice,
      });
    }
  }

  // Test result
  if (invalidPriceFound) {
    testReport.push("Test Result:  FAILED");
    testReport.push("Reason: Invalid price detected");
    testReport.push("");
    testReport.push("Bug Details:");
    for (var k = 0; k < invalidPriceDetails.length; k++) {
      var inv = invalidPriceDetails[k];
      testReport.push("  - Booking ID " + inv.id + " (" + inv.code + ")");
      testReport.push(
        "    Harga di Booking: Rp " + formatNumber(inv.bookingPrice)
      );
      testReport.push(
        "    Harga Seharusnya: Rp " + formatNumber(inv.correctPrice)
      );
      testReport.push(
        "    Selisih: Rp " +
          formatNumber(Math.abs(inv.difference)) +
          (inv.difference > 0 ? " (lebih mahal)" : " (lebih murah)")
      );
      testReport.push("    Status: INVALID PRICE");
    }
    failedTests++;
  } else {
    testReport.push("Test Result: PASSED");
    testReport.push("All prices are valid");
    passedTests++;
  }

  testReport.push("");

  // ========================================
  // TEST SUMMARY
  // ========================================
  testReport.push(
    "================================================================================"
  );
  testReport.push("                         TEST SUMMARY");
  testReport.push(
    "================================================================================"
  );
  testReport.push("Total Test Cases: " + totalTests);
  testReport.push("Passed: " + passedTests);
  testReport.push("Failed: " + failedTests);
  testReport.push(
    "Success Rate: " + Math.round((passedTests / totalTests) * 100) + "%"
  );
  testReport.push("");

  if (failedTests > 0) {
    testReport.push("OVERALL STATUS: FAILED");
    testReport.push("Action Required: Fix bugs and retest");
  } else {
    testReport.push("OVERALL STATUS: PASSED");
    testReport.push("All test cases passed successfully");
  }

  testReport.push(
    "================================================================================"
  );

  // Output results
  var reportText = testReport.join("\n");
  Logger.log(reportText);

  // Save to sheet
  Logger.log("Saving report to sheet...");

  var reportSheet = ss.getSheetByName("Test Report");

  if (reportSheet) {
    // Sheet sudah ada, clear dulu
    Logger.log("Clearing existing Test Report sheet...");
    reportSheet.clear();
  } else {
    // Buat sheet baru
    Logger.log("Creating new Test Report sheet...");
    reportSheet = ss.insertSheet("Test Report");
  }

  // Tulis report baris per baris (lebih reliable)
  Logger.log("Writing report line by line...");
  for (var i = 0; i < testReport.length; i++) {
    reportSheet.getRange(i + 1, 1).setValue(testReport[i]);
  }

  // Format sheet
  Logger.log("Formatting sheet...");
  reportSheet.setColumnWidth(1, 900);
  var lastRow = testReport.length;
  reportSheet.getRange(1, 1, lastRow, 1).setFontFamily("Courier New");
  reportSheet.getRange(1, 1, lastRow, 1).setFontSize(10);
  reportSheet.getRange(1, 1, lastRow, 1).setWrap(false);

  Logger.log("\n Test execution completed!");
  Logger.log("Report saved to 'Test Report' sheet");
}

// Helper functions
function formatDate(dateValue) {
  if (dateValue instanceof Date) {
    var year = dateValue.getFullYear();
    var month = ("0" + (dateValue.getMonth() + 1)).slice(-2);
    var day = ("0" + dateValue.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
  }
  return dateValue.toString();
}

function formatTime(timeValue) {
  if (timeValue instanceof Date) {
    var hours = ("0" + timeValue.getHours()).slice(-2);
    var minutes = ("0" + timeValue.getMinutes()).slice(-2);
    var seconds = ("0" + timeValue.getSeconds()).slice(-2);
    return hours + ":" + minutes + ":" + seconds;
  }
  return timeValue.toString();
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
