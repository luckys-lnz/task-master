/**
 * Test script for start-time notifications
 * 
 * Run this in your browser console while logged into the app
 * This will create a test task that starts in 6 minutes (so you'll get a notification in 1 minute)
 */

async function createTestTask() {
  const now = new Date();
  
  // Create start time 6 minutes from now (so notification fires in 1 minute)
  const startTime = new Date(now.getTime() + 6 * 60 * 1000);
  
  // Create end time 1 hour from start
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  const testTask = {
    title: "Test Task - Start Notification",
    description: "Testing start-time notification (should say 'starts in 5 mins')",
    priority: "MEDIUM",
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    notifyOnStart: true,
    status: "PENDING"
  };
  
  try {
    console.log("Creating test task...");
    console.log("Start time:", startTime.toLocaleString());
    console.log("End time:", endTime.toLocaleString());
    console.log("Notification should fire in ~1 minute");
    
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testTask)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${error}`);
    }
    
    const createdTask = await response.json();
    console.log("✅ Test task created successfully!");
    console.log("Task ID:", createdTask.id);
    console.log("Expected notification message: 'Task Starting Soon' - '\"Test Task - Start Notification\" starts in 5 mins'");
    console.log("\n⏰ Wait ~1 minute and you should see the notification!");
    
    return createdTask;
  } catch (error) {
    console.error("❌ Error creating test task:", error);
    throw error;
  }
}

// Run the test
createTestTask().catch(console.error);
