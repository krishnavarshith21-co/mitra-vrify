yaw = 0.9
pitch = -21.3
roll = -3.2

pose_category = "Front"
if yaw < -35: pose_category = "Right 45"
elif yaw < -20: pose_category = "Right 30"
elif yaw < -8: pose_category = "Right 15"
elif yaw > 35: pose_category = "Left 45"
elif yaw > 20: pose_category = "Left 30"
elif yaw > 8: pose_category = "Left 15"

if pitch > 10: pose_category = "Up"
elif pitch < -10: pose_category = "Down"

print(f"Final pose_category: {pose_category}")
