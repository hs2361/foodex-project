# Webkriti Project
## *Foodex: The Food Ordering and Rating Web App*
(https://foodex-webkriti.herokuapp.com)

### Overview:
Food Ordering + Rating Web App for Webkriti. Our Website allows two types of users: Customers and Restaurants.

Customers can browse and search through a catalogue of restaurants and order their favorite dishes. The customer will be shown his cart of items which he can checkout. He/She will be Presented a screen that shows him the order status. A prepared order will be 'successfully delivered' after a short time duration. Moreover, the Customer can view his past orders, and provide/view rating and feedback for the same.

Restaurants will be provided with a dashboard, where they can easily view their Running Orders. When the Restaurat prepares the order, he can 'Finish' the order, and the change will be reflected on the Customer's order status screen. The restaurant can use his profile tab to view his Menu Page, where they can view and add to their dish menu. Lastly the restaurant can visit a feedback page, where thay will be shown the feedback on the orders they have completed in the past.

### Usage Features:
* The website has been made responsive for ease of use for the user (some minor issues for now)

* Customers can search by various types, like Restaurant Name, or Category
* Customers' session is stored and hence can retain his login on a browser
* Customers can see the average rating of a restaurant

* Restaurant can see a dynamic list of running orders that refreshes automatically when a user makes an order
* Restaurant can view individual feedback for every order

### Security Features:
* User account (both Restaurants and Customers) is verified on signup through an email verification system.
* We do not store plain-text passwords anywhere in the code. More over, the password-hash is also not sent to the user when creating his session
* Input validation is done directly on the front end. Backend verification is added to ensure that **SQL injections** or **Cross-site scripting** cannot be executed

### Images:
(https://photos.app.goo.gl/szyYbd1q3BhNEwpg7)

### Video:
(https://drive.google.com/file/d/1lAOEHew18OldHIhk70Ug4hY5ifXhnwdI/view?usp=sharing)
