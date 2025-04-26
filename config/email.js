const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your Gmail
        pass: process.env.EMAIL_PASS || 'your-app-password' // Replace with your Gmail App Password
    }
});

// Function to send email to NGOs
const sendNgoNotification = async (ngoEmail, donationDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: ngoEmail,
        subject: 'New Food Donation Available in Your Area',
        html: `
            <h2>New Food Donation Available!</h2>
            <p>A new food donation has been made in your area. Here are the details:</p>
            <ul>
                <li><strong>Food Item:</strong> ${donationDetails.item_name}</li>
                <li><strong>Quantity:</strong> ${donationDetails.quantity}</li>
                <li><strong>Food Age:</strong> ${donationDetails.food_quality}</li>
                <li><strong>Address:</strong> ${donationDetails.address}</li>
                <li><strong>Pincode:</strong> ${donationDetails.pincode}</li>
            </ul>
            ${donationDetails.description ? `<p><strong>Additional Details:</strong> ${donationDetails.description}</p>` : ''}
            <p>Please contact the donor as soon as possible to arrange pickup.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to NGO: ${ngoEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendNgoNotification
}; 