// Content script for US Visa Scheduler Bot
console.log('🤖 ============================================');
console.log('🤖 Visa Scheduler Bot loaded');
console.log('🤖 Timestamp:', new Date().toLocaleString());
console.log('🤖 Page URL:', window.location.href);
console.log('🤖 ============================================');

let botInterval = null;
let botConfig = {
  email: '',
  interval: 30000,
  notificationInterval: 200000,
  running: false
};

// Flag to prevent multiple simultaneous checks
let isChecking = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📩 ============================================');
  console.log('📩 Message received from popup');
  console.log('📩 Action:', request.action);
  console.log('📩 Full request:', request);
  console.log('📩 ============================================');

  if (request.action === 'startBot') {
    botConfig.email = request.email;
    botConfig.interval = request.interval;
    botConfig.notificationInterval = request.notificationInterval;
    botConfig.running = true;
    
    console.log('⚙️ ============================================');
    console.log('⚙️ Bot configuration set:');
    console.log('⚙️ Email:', botConfig.email);
    console.log('⚙️ Loop Cycle Interval:', botConfig.interval, 'ms (', botConfig.interval / 1000, 'seconds)');
    console.log('⚙️ Notification Interval:', botConfig.notificationInterval, 'ms (', botConfig.notificationInterval / 1000, 'seconds)');
    console.log('⚙️ Running:', botConfig.running);
    console.log('⚙️ ============================================');
    
    // Initialize timing in storage
    const now = Date.now();
    chrome.storage.local.set({
      lastCycleTime: now,
      nextCycleTime: now, // First cycle runs immediately
      lastNoSlotsEmailTime: 0,
      lastSlotsAvailableEmailTime: 0,
      cycleCounter: 0
    }, () => {
      console.log('✅ Timing variables initialized in storage');
      startBot();
    });
    
    sendResponse({ success: true });
  } else if (request.action === 'stopBot') {
    stopBot();
    sendResponse({ success: true });
  }
  
  return true;
});

function startBot() {
  console.log('🚀 ============================================');
  console.log('🚀 STARTING BOT');
  console.log('🚀 Configuration:');
  console.log('🚀   - Loop cycle every:', botConfig.interval / 1000, 'seconds');
  console.log('🚀   - Email notification every:', botConfig.notificationInterval / 1000, 'seconds (for "No Slots")');
  console.log('🚀   - Immediate notification if slots available: YES');
  console.log('🚀 ============================================');
  
  // Set up interval for continuous checking with PRECISE TIMING
  if (botInterval) {
    clearInterval(botInterval);
    console.log('🧹 Cleared existing interval');
  }
  
  // Check every second to see if it's time to run
  botInterval = setInterval(async () => {
    if (!botConfig.running || isChecking) {
      return;
    }
    
    // Get timing from storage
    chrome.storage.local.get([
      'nextCycleTime', 
      'lastCycleTime',
      'cycleCounter'
    ], async (result) => {
      const now = Date.now();
      const nextCycleTime = result.nextCycleTime || now;
      const lastCycleTime = result.lastCycleTime || 0;
      const cycleCounter = result.cycleCounter || 0;
      const timeUntilNextCycle = nextCycleTime - now;
      const timeSinceLastCycle = now - lastCycleTime;
      
      // Log every 5 seconds to avoid spam
      if (timeUntilNextCycle > 0 && Math.floor(timeSinceLastCycle / 1000) % 5 === 0) {
        console.log('⏳ Waiting... Time until next cycle:', Math.ceil(timeUntilNextCycle / 1000), 'seconds');
      }
      
      // Check if it's time to run the next cycle
      if (now >= nextCycleTime) {
        const actualWaitTime = now - lastCycleTime;
        
        console.log('⏰ ============================================');
        console.log('⏰ TIME TO RUN CYCLE!');
        console.log('⏰ Current time:', new Date(now).toLocaleString());
        console.log('⏰ Last cycle:', lastCycleTime > 0 ? new Date(lastCycleTime).toLocaleString() : 'Never');
        console.log('⏰ Expected wait:', botConfig.interval / 1000, 'seconds');
        console.log('⏰ Actual wait:', Math.floor(actualWaitTime / 1000), 'seconds');
        console.log('⏰ Difference:', Math.floor((actualWaitTime - botConfig.interval) / 1000), 'seconds');
        console.log('⏰ ============================================');
        
        // Update timing for next cycle IN STORAGE
        const newCycleCounter = cycleCounter + 1;
        const newNextCycleTime = now + botConfig.interval;
        
        await chrome.storage.local.set({
          lastCycleTime: now,
          nextCycleTime: newNextCycleTime,
          cycleCounter: newCycleCounter
        });
        
        console.log('🕐 Next cycle scheduled for:', new Date(newNextCycleTime).toLocaleString());
        console.log('📝 Timing saved to storage');
        
        runBotCycle(newCycleCounter);
      }
    });
  }, 1000); // Check every second for precise timing
  
  updatePopupStatus('Bot is running...', 'active');
  console.log('✅ Bot interval timer started (checking every 1 second)');
}

function stopBot() {
  console.log('🛑 ============================================');
  console.log('🛑 STOPPING BOT');
  console.log('🛑 ============================================');
  
  botConfig.running = false;
  isChecking = false;
  
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
    console.log('🧹 Interval cleared');
  }
  
  // Clear timing from storage
  chrome.storage.local.remove(['lastCycleTime', 'nextCycleTime', 'cycleCounter']);
  
  updatePopupStatus('Bot stopped', '');
  console.log('✅ Bot stopped successfully');
}

async function runBotCycle(cycleNumber) {
  if (isChecking) {
    console.log('⏭️ Check already in progress, skipping...');
    return;
  }
  
  isChecking = true;
  
  console.log('🔄 ============================================');
  console.log('🔄 RUNNING BOT CYCLE #' + cycleNumber);
  console.log('🔄 Start Time:', new Date().toLocaleTimeString());
  console.log('🔄 Timestamp:', Date.now());
  console.log('🔄 ============================================');
  
  const currentUrl = window.location.href;
  console.log('🌐 Current URL:', currentUrl);
  
  const cycleStartTime = Date.now();
  
  try {
    // Step 1: If on home page, click Schedule Appointment
    if (currentUrl === 'https://www.usvisascheduling.com/en-US/' || 
        (currentUrl.includes('/en-US/') && !currentUrl.includes('/schedule'))) {
      console.log('📍 Step 1: On home page, clicking Schedule Appointment...');
      await clickScheduleAppointment();
    }
    // Step 2: If on schedule page, select DHAKA and check slots
    else if (currentUrl.includes('/schedule')) {
      console.log('📍 Step 2: On schedule page, selecting DHAKA and checking slots...');
      await selectDhakaAndCheckSlots(cycleNumber);
      
      // After checking slots, navigate back to home for next cycle
      console.log('✅ Slot check complete. Navigating to home page for next cycle...');
      await sleep(2000);
      window.location.href = 'https://www.usvisascheduling.com/en-US/';
    }
    
    const cycleEndTime = Date.now();
    const cycleDuration = cycleEndTime - cycleStartTime;
    
    console.log('✅ ============================================');
    console.log('✅ CYCLE #' + cycleNumber + ' COMPLETED');
    console.log('✅ End Time:', new Date().toLocaleTimeString());
    console.log('✅ Duration:', Math.floor(cycleDuration / 1000), 'seconds');
    console.log('✅ Next cycle in:', botConfig.interval / 1000, 'seconds');
    console.log('✅ ============================================');
    
  } catch (error) {
    console.error('❌ ============================================');
    console.error('❌ ERROR in bot cycle #' + cycleNumber);
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ============================================');
  } finally {
    isChecking = false;
    console.log('🔓 isChecking flag released');
  }
}

async function clickScheduleAppointment() {
  console.log('🔍 Searching for Schedule Appointment link...');
  const scheduleLink = document.querySelector('#continue_application');
  
  if (scheduleLink) {
    console.log('✅ Found Schedule Appointment link');
    console.log('📋 Link element:', scheduleLink);
    console.log('📋 Link href:', scheduleLink.href);
    console.log('📋 Link text:', scheduleLink.textContent);
    
    // Click the link
    scheduleLink.click();
    console.log('🖱️ Clicked Schedule Appointment');
    
    // Wait for page to load
    console.log('⏳ Waiting 2 seconds for page to load...');
    await sleep(2000);
    console.log('✅ Wait complete');
  } else {
    console.log('❌ Schedule Appointment link not found');
  }
}

async function selectDhakaAndCheckSlots(cycleNumber) {
  console.log('🔍 Searching for select element...');
  const selectElement = document.querySelector('#post_select');
  
  if (!selectElement) {
    console.log('❌ Select element not found');
    return;
  }
  
  console.log('✅ Found select element');
  console.log('📋 Select element:', selectElement);
  console.log('📋 Current value:', selectElement.value);
  console.log('📋 Available options:', Array.from(selectElement.options).map(o => ({ value: o.value, text: o.text })));
  
  // Target value for DHAKA
  const dhakaValue = '906af614-b0db-ec11-a7b4-001dd80234f6';
  
  // Check if already selected
  if (selectElement.value === dhakaValue) {
    console.log('✅ DHAKA already selected');
  } else {
    console.log('🔧 Selecting DHAKA...');
    
    // Select DHAKA
    selectElement.value = dhakaValue;
    console.log('✅ DHAKA value set');
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    selectElement.dispatchEvent(changeEvent);
    console.log('📤 Dispatched change event');
    
    // Wait for page to update after selection
    console.log('⏳ Waiting 3 seconds for page update...');
    await sleep(3000);
    console.log('✅ Wait complete');
  }
  
  // Now check for slots
  console.log('⏳ Waiting 1 second before checking slots...');
  await sleep(1000);
  await checkForSlots(cycleNumber);
}

async function checkForSlots(cycleNumber) {
  console.log('🔍 ============================================');
  console.log('🔍 CHECKING FOR APPOINTMENT SLOTS');
  console.log('🔍 Check time:', new Date().toLocaleString());
  console.log('🔍 Timestamp:', Date.now());
  console.log('🔍 ============================================');
  
  // STEP 1: Look for "No Slots Available" message in the page
  const bodyText = document.body.innerText || document.body.textContent;
  const noSlotsAvailable = bodyText.includes('No Slots Available');
  
  console.log('📄 Step 1: Page text search results:');
  console.log('   - Contains "No Slots Available":', noSlotsAvailable);
  
  // Also check for the specific element with that text
  const noSlotsElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.trim() === 'No Slots Available'
  );
  
  if (noSlotsElement) {
    console.log('✅ Found "No Slots Available" element:', noSlotsElement);
    console.log('   - Tag:', noSlotsElement.tagName);
    console.log('   - Classes:', noSlotsElement.className);
    console.log('   - ID:', noSlotsElement.id);
  }
  
  // If "No Slots Available" text is found, definitely no slots
  if (noSlotsAvailable || noSlotsElement) {
    console.log('❌ ============================================');
    console.log('❌ NO SLOTS AVAILABLE (Text found on page)');
    console.log('❌ ============================================');
    await sendEmailWithCooldown(false, cycleNumber);
    return;
  }
  
  // STEP 2: If "No Slots Available" text is NOT found, check the calendar
  console.log('📅 Step 2: "No Slots Available" text NOT found, checking calendar...');
  
  const calendarCheck = checkCalendarForAvailableAppointments();
  
  if (calendarCheck.hasAvailableSlots) {
    console.log('🎉 ============================================');
    console.log('🎉 SLOTS ARE AVAILABLE!!!');
    console.log('🎉 Available dates found in calendar:', calendarCheck.availableDatesCount);
    console.log('🎉 Details:', calendarCheck.details);
    console.log('🎉 ============================================');
    await sendEmailWithCooldown(true, cycleNumber);
  } else {
    console.log('❌ ============================================');
    console.log('❌ NO SLOTS AVAILABLE');
    console.log('❌ Reason: All calendar dates show "No Available Appointments"');
    console.log('❌ Total dates checked:', calendarCheck.totalDates);
    console.log('❌ Unavailable dates:', calendarCheck.unavailableDatesCount);
    console.log('❌ ============================================');
    await sendEmailWithCooldown(false, cycleNumber);
  }
}

function checkCalendarForAvailableAppointments() {
  console.log('🗓️ ============================================');
  console.log('🗓️ CHECKING CALENDAR FOR AVAILABLE APPOINTMENTS');
  console.log('🗓️ ============================================');
  
  // Find the datepicker element
  const datepicker = document.querySelector('#datepicker') || 
                     document.querySelector('.ui-datepicker') ||
                     document.querySelector('.hasDatepicker');
  
  if (!datepicker) {
    console.log('⚠️ Datepicker not found on page');
    console.log('⚠️ Assuming no calendar = no slots available');
    return {
      hasAvailableSlots: false,
      totalDates: 0,
      unavailableDatesCount: 0,
      availableDatesCount: 0,
      details: 'Calendar not found'
    };
  }
  
  console.log('✅ Datepicker found:', datepicker);
  
  // Find all calendar date cells (td elements with dates)
  const allDateCells = datepicker.querySelectorAll('td:not(.ui-datepicker-other-month)');
  console.log('📊 Total date cells found:', allDateCells.length);
  
  // Find dates with "No Available Appointments" (redday class)
  const unavailableDates = datepicker.querySelectorAll('td.redday');
  console.log('🔴 Unavailable dates (redday):', unavailableDates.length);
  
  // Alternative check: Find dates with title="No Available Appointments"
  const unavailableByTitle = datepicker.querySelectorAll('td[title="No Available Appointments"]');
  console.log('🔴 Unavailable dates (by title):', unavailableByTitle.length);
  
  // Find available dates (dates that are NOT disabled and NOT redday)
  const availableDates = Array.from(allDateCells).filter(cell => {
    const isDisabled = cell.classList.contains('ui-state-disabled');
    const isRedday = cell.classList.contains('redday');
    const hasNoAppointmentsTitle = cell.getAttribute('title') === 'No Available Appointments';
    const isOtherMonth = cell.classList.contains('ui-datepicker-other-month');
    
    // A date is available if:
    // - It's not from another month
    // - It's not disabled
    // - It's not marked as redday
    // - It doesn't have "No Available Appointments" title
    return !isOtherMonth && !isDisabled && !isRedday && !hasNoAppointmentsTitle;
  });
  
  console.log('✅ Available dates found:', availableDates.length);
  
  if (availableDates.length > 0) {
    console.log('📅 Available dates details:');
    availableDates.forEach((cell, index) => {
      const dateText = cell.textContent.trim();
      const title = cell.getAttribute('title');
      console.log(`   ${index + 1}. Date: ${dateText}, Title: ${title || 'No title'}`);
    });
  }
  
  const totalNonOtherMonthDates = allDateCells.length;
  const hasAvailableSlots = availableDates.length > 0;
  
  console.log('📊 ============================================');
  console.log('📊 CALENDAR CHECK SUMMARY:');
  console.log('📊 Total dates:', totalNonOtherMonthDates);
  console.log('📊 Unavailable dates:', Math.max(unavailableDates.length, unavailableByTitle.length));
  console.log('📊 Available dates:', availableDates.length);
  console.log('📊 Has available slots:', hasAvailableSlots);
  console.log('📊 ============================================');
  
  return {
    hasAvailableSlots: hasAvailableSlots,
    totalDates: totalNonOtherMonthDates,
    unavailableDatesCount: Math.max(unavailableDates.length, unavailableByTitle.length),
    availableDatesCount: availableDates.length,
    details: hasAvailableSlots ? 
      `Found ${availableDates.length} available date(s)` : 
      'All dates show "No Available Appointments"'
  };
}

async function sendEmailWithCooldown(slotsAvailable, cycleNumber) {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      'lastNoSlotsEmailTime',
      'lastSlotsAvailableEmailTime'
    ], async (result) => {
      const now = Date.now();
      const lastNotified = slotsAvailable ? 
        (result.lastSlotsAvailableEmailTime || 0) : 
        (result.lastNoSlotsEmailTime || 0);
      
      // IMPORTANT: Different cooldown logic
      // - If slots available: NO cooldown (send immediately)
      // - If no slots: Use the notification interval
      const cooldown = slotsAvailable ? 0 : botConfig.notificationInterval;
      
      const timeSinceLastNotification = now - lastNotified;
      const remainingCooldown = cooldown - timeSinceLastNotification;
      
      console.log('📧 ============================================');
      console.log('📧 EMAIL NOTIFICATION CHECK');
      console.log('📧 Current time:', new Date(now).toLocaleString());
      console.log('📧 Cycle:', cycleNumber);
      console.log('📧 Slots available:', slotsAvailable);
      console.log('📧 Last notification:', lastNotified > 0 ? new Date(lastNotified).toLocaleString() : 'Never');
      console.log('📧 Time since last notification:', Math.floor(timeSinceLastNotification / 1000), 'seconds');
      console.log('📧 Required cooldown:', cooldown / 1000, 'seconds');
      console.log('📧 Cooldown type:', slotsAvailable ? '🚀 IMMEDIATE (0s)' : '⏰ INTERVAL (' + (cooldown / 1000) + 's)');
      
      if (lastNotified === 0) {
        console.log('📧 ✅ First notification - will send!');
      } else if (timeSinceLastNotification >= cooldown) {
        console.log('📧 ✅ Cooldown period passed - will send!');
      } else if (slotsAvailable) {
        console.log('📧 ✅ 🚀 SLOTS AVAILABLE - bypassing cooldown, will send immediately!');
      } else {
        console.log('📧 ❌ Still in cooldown period - will NOT send');
      }
      console.log('📧 ============================================');
      
      // Check if we're still in cooldown period
      if (!slotsAvailable && lastNotified > 0 && timeSinceLastNotification < cooldown) {
        const remainingTime = Math.ceil(remainingCooldown / 1000);
        console.log('⏳ ============================================');
        console.log('⏳ COOLDOWN ACTIVE - EMAIL NOT SENT');
        console.log('⏳ Remaining cooldown:', remainingTime, 'seconds');
        console.log('⏳ Next email at:', new Date(lastNotified + cooldown).toLocaleTimeString());
        console.log('⏳ ============================================');
        
        updatePopupStatus(
          `No slots. Next email in ${remainingTime}s`,
          ''
        );
        resolve();
        return;
      }
      
      // If we reach here, we should send the email
      console.log('✅ ============================================');
      console.log('✅ COOLDOWN CHECK PASSED - SENDING EMAIL NOW');
      if (slotsAvailable) {
        console.log('✅ Reason: SLOTS AVAILABLE (immediate notification)');
      } else if (lastNotified === 0) {
        console.log('✅ Reason: FIRST NOTIFICATION');
      } else {
        console.log('✅ Reason: COOLDOWN PERIOD PASSED');
      }
      console.log('✅ ============================================');
      
      // Update last notification time BEFORE sending to prevent duplicates
      const updateData = slotsAvailable ? 
        { lastSlotsAvailableEmailTime: now } : 
        { lastNoSlotsEmailTime: now };
      
      await chrome.storage.local.set(updateData);
      
      console.log('📝 Updated notification time in storage:', slotsAvailable ? 'slotsAvailable' : 'noSlots', new Date(now).toLocaleString());
      
      await sendEmailViaGmail(slotsAvailable, cycleNumber);
      resolve();
    });
  });
}

async function sendEmailViaGmail(slotsAvailable, cycleNumber) {
  const subject = slotsAvailable 
    ? 'URGENT: US Visa Appointment Slots Available!' 
    : 'No US Visa Appointment Slots Available';
  
  const message = slotsAvailable
    ? `Great news! Appointment slots are now available for US Visa scheduling in DHAKA.\n\nPlease visit https://www.usvisascheduling.com/en-US/schedule/ immediately to book your appointment.\n\nTime: ${new Date().toLocaleString()}\nCycle: #${cycleNumber}\n\n- US Visa Scheduler Bot`
    : `No appointment slots are currently available for US Visa scheduling in DHAKA.\n\nThe bot will continue checking every ${botConfig.interval / 1000} seconds.\nNext "No Slots" notification in ${botConfig.notificationInterval / 1000} seconds.\n\nTime: ${new Date().toLocaleString()}\nCycle: #${cycleNumber}\n\n- US Visa Scheduler Bot`;
  
  // Parse multiple emails
  const emails = botConfig.email.split(',').map(e => e.trim()).filter(e => e);
  
  console.log('📧 ============================================');
  console.log('📧 PREPARING GMAIL EMAIL');
  console.log('📧 To:', emails);
  console.log('📧 Total recipients:', emails.length);
  console.log('📧 Subject:', subject);
  console.log('📧 Slots available:', slotsAvailable);
  console.log('📧 Cycle:', cycleNumber);
  console.log('📧 Timestamp:', new Date().toLocaleString());
  console.log('📧 ============================================');
  
  try {
    // Store email data for each recipient
    await chrome.storage.local.set({
      pendingEmail: {
        to: emails,
        subject: subject,
        message: message,
        timestamp: Date.now()
      }
    });
    
    console.log('✅ Email data stored in chrome.storage');
    console.log('📦 Stored data:', { to: emails, subject: subject.substring(0, 50) + '...' });
    
    // Open Gmail compose in a new tab
    const gmailComposeUrl = 'https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=new';
    console.log('🌐 Opening Gmail compose window...');
    console.log('🔗 URL:', gmailComposeUrl);
    
    window.open(gmailComposeUrl, '_blank');
    
    console.log('✅ Gmail compose tab opened');
    
    updatePopupStatus(
      slotsAvailable ? `🎉 SLOTS AVAILABLE! Emailing ${emails.length} recipient(s)` : `📧 Email sent to ${emails.length} recipient(s)`,
      slotsAvailable ? 'active' : ''
    );
    
    // Send browser notification as backup
    chrome.runtime.sendMessage({
      action: 'notify',
      slotsAvailable: slotsAvailable,
      email: emails.join(', '),
      subject: subject,
      message: message
    });
    
    console.log('✅ Browser notification sent');
    console.log('✅ ============================================');
    console.log('✅ EMAIL PROCESS COMPLETED');
    console.log('✅ ============================================');
    
  } catch (error) {
    console.error('❌ ============================================');
    console.error('❌ FAILED TO SEND EMAIL VIA GMAIL');
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ============================================');
    updatePopupStatus('Gmail error! Check console', 'error');
  }
  
  // If slots are available, stop the bot
  if (slotsAvailable) {
    console.log('🎉 ============================================');
    console.log('🎉 SLOTS FOUND! STOPPING BOT');
    console.log('🎉 ============================================');
    stopBot();
  }
}

function updatePopupStatus(message, type) {
  try {
    chrome.runtime.sendMessage({
      action: 'updateStatus',
      message: message,
      type: type
    });
    console.log('📊 Status update sent to popup:', message);
  } catch (error) {
    console.error('❌ Failed to update popup status:', error);
  }
}

function sleep(ms) {
  console.log(`💤 Sleeping for ${ms}ms (${ms/1000}s)...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-start if bot was running before page reload
chrome.storage.local.get([
  'botRunning', 
  'notifyEmail', 
  'checkInterval', 
  'notificationInterval',
  'nextCycleTime',
  'lastCycleTime'
], (result) => {
  console.log('🔄 ============================================');
  console.log('🔄 CHECKING FOR AUTO-START');
  console.log('🔄 Saved settings:', result);
  console.log('🔄 ============================================');
  
  if (result.botRunning && result.notifyEmail) {
    console.log('🔄 Auto-starting bot from previous session...');
    
    botConfig.email = result.notifyEmail;
    botConfig.interval = result.checkInterval || 30000;
    botConfig.notificationInterval = result.notificationInterval || 200000;
    botConfig.running = true;
    
    const now = Date.now();
    const nextCycleTime = result.nextCycleTime || now;
    const lastCycleTime = result.lastCycleTime || 0;
    const timeUntilNext = Math.max(0, nextCycleTime - now);
    
    console.log('⚙️ Restored configuration:');
    console.log('   - Email:', botConfig.email);
    console.log('   - Loop Interval:', botConfig.interval, 'ms (', botConfig.interval / 1000, 's)');
    console.log('   - Notification Interval:', botConfig.notificationInterval, 'ms (', botConfig.notificationInterval / 1000, 's)');
    console.log('   - Last cycle:', lastCycleTime > 0 ? new Date(lastCycleTime).toLocaleString() : 'Never');
    console.log('   - Next cycle:', new Date(nextCycleTime).toLocaleString());
    console.log('   - Time until next:', Math.ceil(timeUntilNext / 1000), 'seconds');
    
    // Small delay before starting to ensure page is fully loaded
    setTimeout(() => {
      console.log('▶️ Starting bot after 2 second delay...');
      startBot();
    }, 2000);
  } else {
    console.log('⏸️ No auto-start required');
  }
});

console.log('✅ ============================================');
console.log('✅ Bot script ready and waiting for commands');
console.log('✅ ============================================');