import random
import string
import pymysql
import getpass

def coinFlip():
    return random.choice([True, False])

def generateFirstName():
    pool = ["Michael", "John", "Alex", "Joseph", "Eli", "Ethan", "Tenghao", "Charlotte", "Susie", "Linus", "Ruby", "Lily", "Rachel", "Andrew", "James", "Peter", "Carol", "Joyce"]
    return random.choice(pool)

def generateMiddleInitial():
    return random.choice(string.ascii_lowercase)

def generateLastName():
    pool = ["Davis", "Feng", "Cavanaugh", "Winek", "Roberts", "Stevens", "White", "Smith", "Carson", "Rosen", "Gaster", "Jordan", "MacCalister", "Bisonette", "Edwards"]
    return random.choice(pool)

def generateEmail(firstName, lastName):
    return str.lower(firstName)[0] + str.lower(lastName) + str(random.randint(1, 999)) + "@gmail.com"

def generateRandomAddress():
    first = ["Frank", "Misty", "Auburn", "Old", "New", "Shy", "Roaring", "West", "South", "East", "West", "King", "Queen", generateFirstName()]
    middle = ["River", "Creek", "Lake", "Bridge", "Bend", "Mountain", "Hill", "Town", "Ranch", "Deer", generateLastName()]
    last = ["Way", "Rd", "St", "Blvd", "Avn", "Lane"]
    return str(random.randint(100, 9999)) + " " + random.choice(first) + " " + random.choice(middle) + " " + random.choice(last)

def generateRandomCity():
    start = ["Moores", "Boone", "Greens", "Alans", "Ethans", "Pierce", "Eli", "Feng", "Lins", "Peters"]
    end = ["ville", "town", "boro", "ton", "burg", "ham", "burgh", "mouth"]
    return random.choice(start) + random.choice(end)

def generateRandomState():
    # Going to reduce the list to these for the sake of simplicity.
    validStates = ["NC", "TN", "VA"]
    return random.choice(validStates)

def generateRandomZip():
    # This won't match with state names, but that isn't important for our purposes.
    return random.randint(10000, 99999)

def generateRandomApartment():
    # We will assume at random that about half of people live in apartments, and give those who don't a number of -1.
    return random.randint(1, 300) if coinFlip() else -1


# Get connection data.
sqlHost = "localhost"
username = input("Enter your username: ")
database = "dingles"
sqlPort = 3306
password = ""

# Initialize connection
connection = pymysql.connect(
	host = sqlHost,
	user = username,
	password = password,
	database = database,
	port = sqlPort
)
cursor = connection.cursor()

# Generate member data
memberData = []
for i in range(1, 10000):
    firstName = generateFirstName()
    lastName = generateLastName()
    phoneNumber = random.randint(1000000000, 9999999999)

    middleInitial = None
    email = None
    address = None
    city = None
    state = None
    zip = None
    apartment = None

    # Decide if this member should have a full data set, or just the bare minimum.
    if coinFlip() == True:
        middleInitial = generateMiddleInitial()
        email = generateEmail(firstName, lastName)
        address = generateRandomAddress()
        city = generateRandomCity()
        state = generateRandomState()
        zip = generateRandomZip()
        apartment = generateRandomApartment()

    memberData.append((firstName, lastName, middleInitial, phoneNumber, email, address, city, state, zip, apartment))

cursor.executemany("CALL add_member(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", memberData)

# Add departments
departmentData = [
    ("Grocery", 0, True),
    ("NF Grocery", 0, False),
    ("Frozen", 0, True),
    ("Meat", 0, True),
    ("Produce", 0, True),
    ("Alcohol/Tobacco", 21, False),
    ("Deli", 0, False),
    ("Bakery", 0, True)
]
cursor.executemany("INSERT INTO department VALUES (%s, %s, %s)", departmentData)

# Add item data
def genBarcode():
    return random.randint(10000, 99999999999)

itemData = [
    # Grocery
    (genBarcode(), "Milk", 4.98, "Grocery", 0, False),
    (genBarcode(), "Bread", 2.98, "Grocery", 0, False),
    (genBarcode(), "Peanut Butter", 2.98, "Grocery", 0, False),
    (genBarcode(), "Eggs", 4.98, "Grocery", 0, False),
    (genBarcode(), "Canned Beans", 1.98, "Grocery", 0, False),
    (genBarcode(), "Ramen", 0.98, "Grocery", 0, False),
    (genBarcode(), "Spaghetti", 2.98, "Grocery", 0, False),
    (genBarcode(), "Tomato Sauce", 4.98, "Grocery", 0, False),
    (genBarcode(), "Chips", 2.98, "Grocery", 0, False),
    (genBarcode(), "Cheese", 1.98, "Grocery", 0, False),
    (genBarcode(), "Butter", 1.98, "Grocery", 0, False),
    (genBarcode(), "Coffee", 9.98, "Grocery", 0, True),
    # NF-Grocery
    (genBarcode(), "Paper Towels", 19.98, "NF Grocery", 0, False),
    (genBarcode(), "Toilet Paper", 19.98, "NF Grocery", 0, False),
    (genBarcode(), "Tissues", 4.98, "NF Grocery", 0, False),
    (genBarcode(), "Paper Plates", 19.98, "NF Grocery", 0, False),
    (genBarcode(), "Hand Sanitizer", 4.98, "NF Grocery", 0, False),
    (genBarcode(), "Soap", 2.98, "NF Grocery", 0, False),
    (genBarcode(), "Shampoo", 2.98, "NF Grocery", 0, False),
    (genBarcode(), "Toothpaste", 2.98, "NF Grocery", 0, False),
    (genBarcode(), "Lip Balm", 0.98, "NF Grocery", 0, False),
    (genBarcode(), "Batteries", 4.98, "NF Grocery", 0, False),
    (genBarcode(), "Fireworks", 49.98, "NF Grocery", 18, False),
    (200, "Dry Ice", 19.98, "NF Grocery", 18, False),
    # Frozen
    (genBarcode(), "Ice Cream", 4.98, "Frozen", 0, False),
    (genBarcode(), "Frozen Yogurt", 4.98, "Frozen", 0, False),
    (genBarcode(), "Microwave Meal", 4.98, "Frozen", 0, False),
    (genBarcode(), "Meatballs", 4.98, "Frozen", 0, False),
    (genBarcode(), "Frozen Vegetables", 2.98, "Frozen", 0, False),
    (genBarcode(), "Frozen Fruit", 2.98, "Frozen", 0, False),
    (genBarcode(), "Waffles", 4.98, "Frozen", 0, False),
    (genBarcode(), "Croissants", 9.98, "Frozen", 0, False),
    (genBarcode(), "Popsicles", 9.98, "Frozen", 0, False),
    (genBarcode(), "Burghley", 99.98, "Frozen", 0, False),
    (10, "#10 Ice", 2.98, "Frozen", 0, False),
    (20, "#20 Ice", 3.98, "Frozen", 0, False),
    # Meat
    (genBarcode(), "Chicken", 19.98, "Meat", 0, False),
    (genBarcode(), "Pork", 14.98, "Meat", 0, False),
    (genBarcode(), "Bacon", 9.98, "Meat", 0, False),
    (genBarcode(), "Turkey", 9.98, "Meat", 0, False),
    (genBarcode(), "Sausage", 9.98, "Meat", 0, False),
    (genBarcode(), "Beef", 14.98, "Meat", 0, False),
    (genBarcode(), "Prime Ribs", 49.98, "Meat", 0, False),
    (genBarcode(), "Hamburger", 9.98, "Meat", 0, False),
    (genBarcode(), "Hot Dogs", 4.98, "Meat", 0, False),
    (genBarcode(), "Brisket", 19.98, "Meat", 0, False),
    (genBarcode(), "Vegan Burgers", 14.98, "Meat", 0, False),
    (genBarcode(), "Beef Livers", 9.98, "Meat", 0, False),
    # Produce
    (4011, "Bananas", 0.98, "Produce", 0, True),
    (3082, "Broccoli", 0.48, "Produce", 0, True),
    (4068, "Green Onions", 0.98, "Produce", 0, False),
    (4050, "Limes", 0.48, "Produce", 0, False),
    (4159, "Sweet Onions", 0.98, "Produce", 0, True),
    (4597, "Cucumbers", 0.98, "Produce", 0, False),
    (4053, "Lemons", 0.48, "Produce", 0, False),
    (4225, "Avocado", 0.98, "Produce", 0, False),
    (4069, "Cabbage", 0.98, "Produce", 0, True),
    (4032, "Watermelon", 4.98, "Produce", 0, False),
    (4799, "Tomatoes", 2.98, "Produce", 0, True),
    (4061, "Lettuce", 1.98, "Produce", 0, True),
    # Alcohol/Tobacco
    (genBarcode(), "6pk Beer", 9.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Exp. Grape Juice", 9.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "More Exp. Grape Juice", 19.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Very Exp. Grape Juice", 49.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Ext. Exp. Grape Juice", 99.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Vodka", 4.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Hard Lemonade", 9.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Bottle o' Scrumpy", 2.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Hard Cider", 9.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Marlboro Light", 9.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Marlboro Medium", 19.98, "Alcohol/Tobacco", 21, False),
    (genBarcode(), "Marlboro Heavy", 49.98, "Alcohol/Tobacco", 21, False),
    # Deli
    (genBarcode(), "Sushi", 4.98, "Deli", 0, False),
    (genBarcode(), "Combo Meal", 6.98, "Deli", 0, False),
    (genBarcode(), "Turkey Sandwich", 6.98, "Deli", 0, False),
    (genBarcode(), "Chicken Sandwich", 5.98, "Deli", 0, False),
    (genBarcode(), "Ham Sandwich", 4.98, "Deli", 0, False),
    (genBarcode(), "Sam Handwich", 4.98, "Deli", 0, False),
    (genBarcode(), "Hand Samwich", 4.98, "Deli", 0, False),
    (genBarcode(), "Salad", 8.98, "Deli", 0, False),
    (genBarcode(), "Soup Special", 6.98, "Deli", 0, False),
    (genBarcode(), "Rotisserie Chicken", 4.98, "Deli", 0, False),
    (genBarcode(), "Statisserie Chicken", 4.98, "Deli", 0, False),
    (genBarcode(), "Motisserie Chicken", 4.98, "Deli", 0, False),
    # Bakery
    (genBarcode(), "Chocolate Cake", 9.98, "Bakery", 0, False),
    (genBarcode(), "Red Velvet Cake", 9.98, "Bakery", 0, False),
    (genBarcode(), "Coconut Cake", 0.98, "Bakery", 0, False),
    (genBarcode(), "Oreo Cake", 14.98, "Bakery", 0, False),
    (genBarcode(), "Cheesecake", 9.98, "Bakery", 0, False),
    (genBarcode(), "Cookie Cake", 9.98, "Bakery", 0, False),
    (genBarcode(), "Pumpkin Pie", 9.98, "Bakery", 0, False),
    (genBarcode(), "Cinnamon Rolls", 9.98, "Bakery", 0, False),
    (310, "Cookies", 2.98, "Bakery", 0, True),
    (300, "Donuts", 0.98, "Bakery", 0, False),
    (315, "Muffins", 0.98, "Bakery", 0, False),
    (320, "Bagels", 0.98, "Bakery", 0, False)
]
cursor.executemany("CALL add_item(%s, %s, %s, %s, %s, %s)", itemData)

# Add sale data
saleData = [
    (300, 0.5, 6, "Half-Dozen Halfer"),
    (20, 0.8, 2, "The N-ice Deal"),
    (4225, 0.5, 2, "The Bo-Go Avocado"),
    (4032, 1, 1, "Buy One Get That One"),
    (4011, 0.9, 1, None),
    (315, 0.8, 1, None)
]
cursor.executemany("CALL assign_sale(%s, %s, %s, %s)", saleData)

# Close connection
connection.commit()
connection.close()