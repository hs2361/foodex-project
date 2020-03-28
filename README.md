# Webkriti Project
## *Foodex: The Food Ordering and Rating Web App*

### Overview:
Food Ordering + Rating Web App for Webkriti. Our Website allows two types of users: Customers and Restaurants.

Customers can browse and search through a catalogue of restaurants and order their favorite dishes. The customer will be shown his cart of items which he can checkout. He/She will be presented a screen that shows him/her the order status. A prepared order will be 'successfully delivered' after a short time duration. Moreover, the Customer can view his past orders. He can also provide or view rating and feedback for the same.

Restaurants will be provided with a dashboard, where they can easily view their Running Orders. When the Restaurant prepares the order, he can click the 'Finish' button for the order, and the updated order status will be reflected on the Customer's order status screen. The restaurant can use their profile tab to view their Menu Page, where they can view and add new dishes to their dish menu. Further, the restaurant can visit a feedback page, where they will be shown the feedback on the orders they have completed in the past.

### Usage Features:
* The website has been made responsive for easy browsing for the user

* Customers can search by various types, like Restaurant Name, or Category.
* Customers' session is stored and hence the login is retained on a browser
* Customers can see the average rating of a restaurant

* Restaurant can see a dynamic list of running orders that refreshes automatically when a user places an order
* Restaurant can view individual feedback for every order

### Security Features:
* User account (both Restaurants and Customers) is verified on Sign Up through an email verification system.
* We do not store plain-text passwords anywhere in the code. More over, the password hash is also not sent to the user when creating his session
* Input validation is done directly on the front end. Backend verification is added to ensure that **SQL injections** or **Cross-site scripting** cannot be executed
