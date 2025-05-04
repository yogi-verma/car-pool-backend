const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const memberRoutes = require("./routes/memberRoutes");
const carOwnerRoutes = require("./routes/CarOwnerRoutes");
const http = require("http");
const socketIo = require("socket.io");
const CarOwner = require("./models/CarOwner");
const Member = require("./models/Member");
const path = require("path");



dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();
const disconnectTimers = new Map();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

// Routes
app.use("/api/members", memberRoutes);
app.use("/api/carowners", carOwnerRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Socket.io Connection Handling
io.on("connection", (socket) => {
  console.log(`✅ New user connected: ${socket.id}`);

  socket.on("carOwnerOnline", async (uid) => {
    if (!uid) return;

    onlineUsers.set(uid, socket.id);
    if (disconnectTimers.has(uid)) {
      clearTimeout(disconnectTimers.get(uid));
      disconnectTimers.delete(uid);
    }

    try {
      await CarOwner.findOneAndUpdate({ uid }, { isOnline: true });
      io.emit("updateCarOwnerStatus", { uid, isOnline: true });
    } catch (error) {
      console.error(`❌ Error updating online status: ${error.message}`);
    }
  });

  // Handle sending a ride request from a member to a car owner
  socket.on("send_ride_request", (data) => {
    const ownerSocketId = onlineUsers.get(data.ownerId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("receive_ride_request", data);
      console.log(
        `📩 Ride request sent from ${data.memberId} to ${data.ownerId}`
      );
    } else {
      console.log(`❌ Car owner ${data.ownerId} is offline`);
    }
  });

  // Handle car owner's response to the ride request
  socket.on("ride_response", (data) => {
    const memberSocketId = onlineUsers.get(data.memberId);
    if (memberSocketId) {
      io.to(memberSocketId).emit("ride_response", data);
      console.log(
        `✅ Ride response sent from ${data.ownerId} to ${data.memberId}`
      );
    } else {
      console.log(`❌ Member ${data.memberId} is offline`);
    }
  });

  socket.on("carOwnerLogout", async (uid) => {
    if (!uid) return;

    onlineUsers.delete(uid);

    try {
      await CarOwner.findOneAndUpdate({ uid }, { isOnline: false });
      io.emit("updateCarOwnerStatus", { uid, isOnline: false });
      socket.disconnect();
    } catch (error) {
      console.error(`❌ Error updating offline status: ${error.message}`);
    }
  });

  socket.on("disconnect", async () => {
    let disconnectedUid = null;

    for (let [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        disconnectedUid = uid;
        onlineUsers.delete(uid);
        break;
      }
    }

    if (disconnectedUid) {
      console.log(
        `⏳ User ${disconnectedUid} disconnected, waiting before marking offline...`
      );

      disconnectTimers.set(
        disconnectedUid,
        setTimeout(async () => {
          console.log(`❌ Marking user ${disconnectedUid} as offline`);
          try {
            await CarOwner.findOneAndUpdate(
              { uid: disconnectedUid },
              { isOnline: false }
            );
            io.emit("updateCarOwnerStatus", {
              uid: disconnectedUid,
              isOnline: false,
            });
          } catch (error) {
            console.error(`❌ Error updating offline status: ${error.message}`);
          }
        }, 5000)
      ); // 10 seconds delay
    }
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
