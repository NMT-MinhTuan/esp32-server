// server.js

const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require('dotenv').config();

// Kích hoạt plugin của dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Khởi tạo app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware để parse JSON
app.use(bodyParser.json());

// Route trang chủ để test server
app.get('/', (req, res) => {
    res.send('🚀 Server ESP32 Data is running!');
});

// Route GET // Nếu ai đó gõ API bằng trình duyệt
app.get('/api/sensor-data', (req, res) => {
    res.send('🛰️ Please send a POST request with sensor data!');
});

// Route POST nhận Data từ ESP32 (hoặc từ Postman)
app.post('/api/sensor-data', async (req, res) => {
    try {
        const { temperature, humidity, waterLevel } = req.body;

        if (temperature === undefined || humidity === undefined || waterLevel === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing fields: temperature, humidity, or waterLevel',
            });
        }

        // Lấy thời gian thực tế theo múi giờ Việt Nam
        const nowVN = dayjs().tz('Asia/Ho_Chi_Minh');
        const dateString = nowVN.format('DD/MM/YYYY');
        const timeString = nowVN.format('HH:mm:ss');

        // Insert dữ liệu vào Database bảng sensor_data
        const { data, error } = await supabase
            .from('sensor_data')
            .insert([
                {
                    temperature,
                    humidity,
                    water_level: waterLevel,
                    date: dateString,
                    time: timeString
                }
            ]);

        if (error) {
            console.error('❌ Error inserting data into Supabase:', error);
            throw error;
        }

        console.log('✅ New data saved:', { temperature, humidity, waterLevel, dateString, timeString });

        res.status(201).json({
            success: true,
            message: 'Data inserted successfully!',
            data,
        });

    } catch (error) {
        console.error('❌ Error processing request:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});