// Background service worker for US Visa Scheduler Bot
console.log('🌐 Background service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📩 Background received message:', request);

  if (request.action === 'notify') {
    console.log('🔔 Creating notification...');
    
    const notificationOptions = {
      type: 'basic',
      iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📧</text></svg>',
      title: request.slotsAvailable 
        ? '✅ Visa Slots Available!' 
        : '📧 Checking Visa Slots',
      message: request.slotsAvailable
        ? 'Appointment slots are now available! Check Gmail tab for email.'
        : 'No slots yet. Check opened Gmail tab for notification.',
      priority: request.slotsAvailable ? 2 : 1
    };

    // Create notification
    chrome.notifications.create(
      `visa-bot-${Date.now()}`,
      notificationOptions,
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
        } else {
          console.log('✅ Notification created:', notificationId);
        }
      }
    );
  }

  return true;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Extension installed/updated');
});