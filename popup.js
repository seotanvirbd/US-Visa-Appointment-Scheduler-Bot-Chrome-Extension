document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBot');
  const stopBtn = document.getElementById('stopBot');
  const statusDiv = document.getElementById('status');
  const emailInput = document.getElementById('notifyEmail');
  const intervalInput = document.getElementById('checkInterval');
  const notificationIntervalInput = document.getElementById('notificationInterval');
  const displayCycleTime = document.getElementById('displayCycleTime');
  const displayNotifyTime = document.getElementById('displayNotifyTime');

  // Update display in real-time when user changes values
  intervalInput.addEventListener('input', () => {
    displayCycleTime.textContent = intervalInput.value;
  });

  notificationIntervalInput.addEventListener('input', () => {
    displayNotifyTime.textContent = notificationIntervalInput.value;
  });

  // Load saved settings
  const settings = await chrome.storage.local.get([
    'notifyEmail', 
    'checkInterval', 
    'notificationInterval',
    'botRunning'
  ]);
  
  if (settings.notifyEmail) {
    emailInput.value = settings.notifyEmail;
  }
  if (settings.checkInterval) {
    const intervalSeconds = settings.checkInterval / 1000;
    intervalInput.value = intervalSeconds;
    displayCycleTime.textContent = intervalSeconds;
  }
  if (settings.notificationInterval) {
    const notificationSeconds = settings.notificationInterval / 1000;
    notificationIntervalInput.value = notificationSeconds;
    displayNotifyTime.textContent = notificationSeconds;
  }
  if (settings.botRunning) {
    updateUIForRunningBot();
  }

  startBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const interval = parseInt(intervalInput.value);
    const notificationInterval = parseInt(notificationIntervalInput.value);

    console.log('🎯 START BUTTON CLICKED');
    console.log('📧 Email:', email);
    console.log('⏱️ Check Interval:', interval, 'seconds');
    console.log('📬 Notification Interval:', notificationInterval, 'seconds');

    if (!email) {
      updateStatus('Please enter at least one email address', 'error');
      return;
    }

    // Validate multiple emails
    const emails = email.split(',').map(e => e.trim()).filter(e => e);
    const invalidEmails = emails.filter(e => !validateEmail(e));
    
    if (invalidEmails.length > 0) {
      updateStatus('Invalid email(s): ' + invalidEmails.join(', '), 'error');
      return;
    }

    if (interval < 10 || interval > 300) {
      updateStatus('Loop cycle interval must be between 10 and 300 seconds', 'error');
      return;
    }

    if (notificationInterval < 30 || notificationInterval > 3600) {
      updateStatus('Email notification interval must be between 30 and 3600 seconds', 'error');
      return;
    }

    // Convert seconds to milliseconds for storage
    const intervalMs = interval * 1000;
    const notificationIntervalMs = notificationInterval * 1000;
    
    console.log('✅ VALIDATION PASSED');
    console.log('📊 Configuration:', {
      emails: emails.length,
      intervalSeconds: interval,
      intervalMs: intervalMs,
      notificationIntervalSeconds: notificationInterval,
      notificationIntervalMs: notificationIntervalMs
    });

    // Save settings
    await chrome.storage.local.set({
      notifyEmail: email,
      checkInterval: intervalMs,
      notificationInterval: notificationIntervalMs,
      botRunning: true
    });

    console.log('💾 Settings saved to storage');

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('usvisascheduling.com')) {
      updateStatus('Please navigate to usvisascheduling.com first', 'error');
      return;
    }

    console.log('🌐 Current tab URL:', tab.url);

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'startBot',
      email: email,
      interval: intervalMs,
      notificationInterval: notificationIntervalMs
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error:', chrome.runtime.lastError);
        updateStatus('Error starting bot. Please refresh the page.', 'error');
        return;
      }
      
      if (response && response.success) {
        updateUIForRunningBot();
        updateStatus(`Bot started! Loop: ${interval}s, Email: ${notificationInterval}s`, 'active');
        console.log('✅ Bot started successfully!');
      } else {
        updateStatus('Failed to start bot', 'error');
        console.error('❌ Bot failed to start');
      }
    });
  });

  stopBtn.addEventListener('click', async () => {
    console.log('🛑 STOP BUTTON CLICKED');
    
    await chrome.storage.local.set({ botRunning: false });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'stopBot'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error stopping bot:', chrome.runtime.lastError);
      }
      
      updateUIForStoppedBot();
      updateStatus('Bot stopped', '');
      console.log('✅ Bot stopped successfully');
    });
  });

  function updateUIForRunningBot() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    emailInput.disabled = true;
    intervalInput.disabled = true;
    notificationIntervalInput.disabled = true;
    console.log('🎨 UI updated: Bot is RUNNING');
  }

  function updateUIForStoppedBot() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    emailInput.disabled = false;
    intervalInput.disabled = false;
    notificationIntervalInput.disabled = false;
    console.log('🎨 UI updated: Bot is STOPPED');
  }

  function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    console.log('📊 Status updated:', message, '(type:', type + ')');
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateStatus') {
      updateStatus(request.message, request.type || '');
    }
  });

  console.log('✅ Popup script initialized and ready');
});