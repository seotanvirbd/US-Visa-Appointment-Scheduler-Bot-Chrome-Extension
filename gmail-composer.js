// Gmail Composer Content Script
// This script runs on Gmail pages to automatically fill in compose fields

console.log('📧 Gmail Composer script loaded');

// Check for pending email immediately when page loads
setTimeout(checkForPendingEmail, 3000);

// Also check periodically in case compose window loads slowly
const checkInterval = setInterval(checkForPendingEmail, 2000);

async function checkForPendingEmail() {
  // Check if we're on Gmail and compose window is open
  if (!window.location.href.includes('mail.google.com')) {
    return;
  }
  
  // Check if compose window is present
  const composeWindow = document.querySelector('[role="dialog"]') || 
                       document.querySelector('.AD') ||
                       document.querySelector('[aria-label*="New Message"]');
  
  if (!composeWindow) {
    console.log('⏳ Waiting for compose window...');
    return;
  }
  
  console.log('✅ Compose window detected!');
  
  // Get pending email data from storage
  const result = await chrome.storage.local.get(['pendingEmail']);
  
  if (!result.pendingEmail) {
    console.log('❌ No pending email data found');
    return;
  }
  
  const { to, subject, message, timestamp } = result.pendingEmail;
  
  // Check if this email is recent (within last 30 seconds)
  const age = Date.now() - timestamp;
  if (age > 30000) {
    console.log('⏰ Pending email is too old, ignoring');
    await chrome.storage.local.remove(['pendingEmail']);
    return;
  }
  
  console.log('📧 Found pending email data:', { to, subject });
  
  // Clear the interval since we found the email
  clearInterval(checkInterval);
  
  // Fill the compose form
  await fillGmailComposeFields(to, subject, message);
  
  // Clear the pending email from storage
  await chrome.storage.local.remove(['pendingEmail']);
}

async function fillGmailComposeFields(toEmail, subject, message) {
  console.log('📝 Starting to fill Gmail compose...');
  
  // Handle multiple recipients
  const recipients = Array.isArray(toEmail) ? toEmail : [toEmail];
  console.log('Recipients:', recipients);
  console.log('Total recipients:', recipients.length);
  console.log('Subject:', subject);
  
  try {
    // Wait a bit to ensure compose window is fully loaded
    await sleep(1000);
    
    // === FILL TO FIELD (Multiple Recipients) ===
    console.log('🎯 Step 1: Filling TO field with', recipients.length, 'recipient(s)...');
    
    // Try multiple selectors for the TO field
    const toInputSelectors = [
      'input[aria-label*="To"]',
      'input.agP',
      'input[peoplekit-id]',
      'textarea[name="to"]',
      '[name="to"] input'
    ];
    
    let toInput = null;
    for (const selector of toInputSelectors) {
      toInput = document.querySelector(selector);
      if (toInput) {
        console.log(`✅ Found TO input with selector: ${selector}`);
        break;
      }
    }
    
    if (toInput) {
      // Fill each recipient email
      for (let i = 0; i < recipients.length; i++) {
        const email = recipients[i];
        console.log(`📧 Adding recipient ${i + 1}/${recipients.length}: ${email}`);
        
        // Focus and fill the TO field
        toInput.click();
        toInput.focus();
        await sleep(200);
        
        // Set value
        toInput.value = email;
        
        // Dispatch input event
        toInput.dispatchEvent(new Event('input', { bubbles: true }));
        toInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Simulate typing
        for (let char of email) {
          const keyEvent = new KeyboardEvent('keydown', { key: char, bubbles: true });
          toInput.dispatchEvent(keyEvent);
        }
        
        await sleep(300);
        
        // Press Enter to confirm this email
        const enterEvent = new KeyboardEvent('keydown', { 
          key: 'Enter', 
          keyCode: 13, 
          which: 13, 
          bubbles: true 
        });
        toInput.dispatchEvent(enterEvent);
        
        console.log(`✅ Recipient ${i + 1} added: ${email}`);
        await sleep(500);
        
        // Clear the input for next recipient
        toInput.value = '';
      }
      
      console.log('✅ All recipients added successfully!');
      await sleep(500);
    } else {
      console.error('❌ TO input not found - tried all selectors');
    }
    
    // === FILL SUBJECT FIELD ===
    console.log('🎯 Step 2: Filling SUBJECT field...');
    
    const subjectInputSelectors = [
      'input[name="subjectbox"]',
      'input[aria-label*="Subject"]',
      'input.aoT'
    ];
    
    let subjectInput = null;
    for (const selector of subjectInputSelectors) {
      subjectInput = document.querySelector(selector);
      if (subjectInput) {
        console.log(`✅ Found SUBJECT input with selector: ${selector}`);
        break;
      }
    }
    
    if (subjectInput) {
      subjectInput.click();
      subjectInput.focus();
      await sleep(200);
      
      subjectInput.value = subject;
      subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
      subjectInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('✅ SUBJECT field filled:', subject);
      await sleep(500);
    } else {
      console.error('❌ SUBJECT input not found');
    }
    
    // === FILL MESSAGE BODY ===
    console.log('🎯 Step 3: Filling MESSAGE BODY...');
    
    const bodySelectors = [
      '[role="textbox"][aria-label*="Message"]',
      '.Am[role="textbox"]',
      '[g_editable="true"]',
      '.editable[role="textbox"]',
      'div[contenteditable="true"][aria-label*="Message"]'
    ];
    
    let messageBody = null;
    for (const selector of bodySelectors) {
      messageBody = document.querySelector(selector);
      if (messageBody) {
        console.log(`✅ Found MESSAGE BODY with selector: ${selector}`);
        break;
      }
    }
    
    if (messageBody) {
      messageBody.click();
      messageBody.focus();
      await sleep(200);
      
      // Clear any existing content
      messageBody.innerHTML = '';
      
      // Set the text with line breaks
      const formattedMessage = message.replace(/\n/g, '<br>');
      messageBody.innerHTML = formattedMessage;
      
      // Alternative: use textContent
      messageBody.textContent = message;
      
      // Dispatch events
      messageBody.dispatchEvent(new Event('input', { bubbles: true }));
      messageBody.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('✅ MESSAGE BODY filled');
      await sleep(1000);
    } else {
      console.error('❌ MESSAGE BODY not found');
    }
    
    // === CLICK SEND BUTTON ===
    console.log('🎯 Step 4: Looking for SEND button...');
    
    const sendButtonSelectors = [
      '[role="button"][aria-label*="Send"]',
      '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
      'div[data-tooltip*="Send"]',
      '[aria-label="Send ‪(Ctrl-Enter)‬"]'
    ];
    
    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      sendButton = document.querySelector(selector);
      if (sendButton) {
        console.log(`✅ Found SEND button with selector: ${selector}`);
        break;
      }
    }
    
    if (sendButton) {
      console.log('✅ SEND button found!');
      console.log('⏳ Waiting 3 seconds before sending...');
      await sleep(3000);
      
      sendButton.click();
      console.log('✅✅✅ SEND BUTTON CLICKED!');
      
      // Wait for confirmation dialog and click OK automatically
      console.log('⏳ Waiting for confirmation dialog...');
      await sleep(1000);
      
      const confirmed = await clickConfirmationDialog();
      
      if (confirmed) {
        console.log('✅✅✅ EMAIL SENT SUCCESSFULLY! ✅✅✅');
      } else {
        console.log('⚠️ No confirmation dialog found - email may have been sent already');
      }
      
    } else {
      console.log('⚠️ SEND button not found - you can send manually');
    }
    
  } catch (error) {
    console.error('❌ Error filling Gmail compose:', error);
    alert('❌ Error: ' + error.message + '\n\nPlease fill and send manually.');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickConfirmationDialog() {
  console.log('🔍 Looking for confirmation dialog...');
  
  // Wait up to 5 seconds for the dialog to appear
  for (let i = 0; i < 10; i++) {
    // Try to find the OK button in the confirmation dialog
    const okButtonSelectors = [
      'button[name="ok"]',
      'button:contains("OK")',
      '[role="button"][aria-label*="OK"]',
      '.T-I.J-J5-Ji.aFh.T-I-atl[role="button"]', // Gmail's OK button class
      '[data-action="ok"]',
      'button.T-I-atl' // Another common Gmail button class
    ];
    
    // Also check for dialog content
    const dialogs = document.querySelectorAll('[role="dialog"], .Kj-JD, [aria-modal="true"]');
    
    console.log(`Attempt ${i + 1}: Found ${dialogs.length} dialog(s)`);
    
    for (const dialog of dialogs) {
      // Check if this is the "Email Sent Successfully" dialog
      const dialogText = dialog.textContent || dialog.innerText;
      console.log('Dialog text:', dialogText);
      
      if (dialogText.includes('Email Sent') || 
          dialogText.includes('Sent Successfully') ||
          dialogText.includes('sent successfully')) {
        
        console.log('✅ Found confirmation dialog!');
        
        // Try to find the OK button within this dialog
        const okButton = dialog.querySelector('button') ||
                        dialog.querySelector('[role="button"]') ||
                        dialog.querySelector('.T-I') ||
                        Array.from(dialog.querySelectorAll('*')).find(el => 
                          el.textContent.trim().toUpperCase() === 'OK'
                        );
        
        if (okButton) {
          console.log('✅ Found OK button in dialog!');
          console.log('OK button element:', okButton);
          
          // Click the OK button
          okButton.click();
          console.log('✅ OK button clicked!');
          
          await sleep(500);
          return true;
        }
      }
    }
    
    // Also try to find any button with "OK" text directly
    const allButtons = document.querySelectorAll('button, [role="button"]');
    for (const button of allButtons) {
      const buttonText = button.textContent.trim().toUpperCase();
      if (buttonText === 'OK') {
        console.log('✅ Found OK button by text:', button);
        button.click();
        console.log('✅ OK button clicked!');
        await sleep(500);
        return true;
      }
    }
    
    await sleep(500);
  }
  
  console.log('⏰ Timeout: No confirmation dialog found after 5 seconds');
  return false;
}

console.log('✅ Gmail Composer script ready');