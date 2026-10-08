const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/student");

const app = express();

app.use(express.json());
app.use(express.static("public"));


// ==========================================
// VALIDATION FUNCTION
// ==========================================

function validateStudentFields(name, age, course) {

    // NAME
    if (!name || !String(name).trim()) {
        return "Name is mandatory.";
    }

    if (!/^[A-Za-z ]+$/.test(String(name).trim())) {
        return "Name must contain letters only.";
    }


    // AGE
    if (
        age === undefined ||
        age === null ||
        String(age).trim() === ""
    ) {
        return "Age is mandatory.";
    }

    const numericAge = Number(age);

    if (
        !Number.isInteger(numericAge) ||
        numericAge < 1 ||
        numericAge > 100
    ) {
        return "Age must be a valid number between 1 and 100.";
    }


    // COURSE
    if (!course || !String(course).trim()) {
        return "Course is mandatory.";
    }

    if (String(course).trim().length < 2) {
        return "Please enter a valid course.";
    }


    return null;
}


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.send("My Node.js server is working!");

});


// ==========================================
// CREATE - ADD STUDENT
// ==========================================

app.post("/students", async (req, res) => {

    try {

        const { name, age, course } = req.body;


        // ------------------------------------------
        // VALIDATION
        // ------------------------------------------

        const validationError =
            validateStudentFields(
                name,
                age,
                course
            );


        if (validationError) {

            return res.status(400).json({
                message: validationError
            });

        }


        // ------------------------------------------
        // DUPLICATE RECORD CHECK
        // ------------------------------------------

        const existingStudent =
            await Student.findOne({

                name: name.trim(),

                age: Number(age),

                course: course.trim()

            });


        if (existingStudent) {

            return res.status(409).json({

                message:
                    "This student record already exists."

            });

        }


        // ------------------------------------------
        // CREATE STUDENT
        // ------------------------------------------

        const student = new Student({

            name: name.trim(),

            age: Number(age),

            course: course.trim()

        });


        const savedStudent =
            await student.save();


        res.status(201).json(savedStudent);

    }


    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// ==========================================
// READ - GET ALL STUDENTS
// ==========================================

app.get("/students", async (req, res) => {

    try {

        const students =
            await Student.find();


        res.json(students);

    }


    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// ==========================================
// UPDATE - COMPLETE STUDENT
// ==========================================

app.put("/students/:id", async (req, res) => {

    try {

        const { name, age, course } =
            req.body;


        // ------------------------------------------
        // VALIDATION
        // ------------------------------------------

        const validationError =
            validateStudentFields(
                name,
                age,
                course
            );


        if (validationError) {

            return res.status(400).json({
                message: validationError
            });

        }


        // ------------------------------------------
        // DUPLICATE CHECK
        // ------------------------------------------

        const existingStudent =
            await Student.findOne({

                name: name.trim(),

                age: Number(age),

                course: course.trim(),

                _id: {
                    $ne: req.params.id
                }

            });


        if (existingStudent) {

            return res.status(409).json({

                message:
                    "Another student with the same record already exists."

            });

        }


        // ------------------------------------------
        // UPDATE STUDENT
        // ------------------------------------------

        const updatedStudent =
            await Student.findByIdAndUpdate(

                req.params.id,

                {
                    name: name.trim(),

                    age: Number(age),

                    course: course.trim()
                },

                {
                    new: true,

                    runValidators: true
                }

            );


        if (!updatedStudent) {

            return res.status(404).json({
                message: "Student not found."
            });

        }


        res.json(updatedStudent);

    }


    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// ==========================================
// UPDATE - ONE FIELD
// ==========================================

app.put("/students/:id/field", async (req, res) => {

    try {

        const { field, value } =
            req.body;


        // ------------------------------------------
        // CHECK VALID FIELD
        // ------------------------------------------

        if (
            !["name", "age", "course"]
                .includes(field)
        ) {

            return res.status(400).json({
                message: "Invalid field."
            });

        }


        // ------------------------------------------
        // CHECK EMPTY VALUE
        // ------------------------------------------

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return res.status(400).json({
                message: `${field} is mandatory.`
            });

        }


        let finalValue;


        // ------------------------------------------
        // NAME VALIDATION
        // ------------------------------------------

        if (field === "name") {

            finalValue =
                String(value).trim();


            if (!/^[A-Za-z ]+$/.test(finalValue)) {

                return res.status(400).json({

                    message:
                        "Name must contain letters only."

                });

            }

        }


        // ------------------------------------------
        // AGE VALIDATION
        // ------------------------------------------

        if (field === "age") {

            const ageValue =
                String(value).trim();


            if (!/^[0-9]+$/.test(ageValue)) {

                return res.status(400).json({

                    message:
                        "Age must contain numbers only."

                });

            }


            finalValue =
                Number(ageValue);


            if (
                !Number.isInteger(finalValue) ||
                finalValue < 1 ||
                finalValue > 100
            ) {

                return res.status(400).json({

                    message:
                        "Age must be between 1 and 100."

                });

            }

        }


        // ------------------------------------------
        // COURSE VALIDATION
        // ------------------------------------------

        if (field === "course") {

            finalValue =
                String(value).trim();


            if (finalValue.length < 2) {

                return res.status(400).json({

                    message:
                        "Please enter a valid course."

                });

            }

        }


        // ------------------------------------------
        // CHECK IF UPDATE CREATES DUPLICATE
        // ------------------------------------------

        const currentStudent =
            await Student.findById(
                req.params.id
            );


        if (!currentStudent) {

            return res.status(404).json({

                message:
                    "Student not found."

            });

        }


        // Create the final record after update

        const newName =
            field === "name"
                ? finalValue
                : currentStudent.name;


        const newAge =
            field === "age"
                ? finalValue
                : currentStudent.age;


        const newCourse =
            field === "course"
                ? finalValue
                : currentStudent.course;


        // Check whether another record
        // already has the same values

        const duplicateStudent =
            await Student.findOne({

                name: newName,

                age: newAge,

                course: newCourse,

                _id: {
                    $ne: req.params.id
                }

            });


        if (duplicateStudent) {

            return res.status(409).json({

                message:
                    "Another student with the same record already exists."

            });

        }


        // ------------------------------------------
        // UPDATE DATABASE
        // ------------------------------------------

        const updatedStudent =
            await Student.findByIdAndUpdate(

                req.params.id,

                {
                    $set: {
                        [field]: finalValue
                    }
                },

                {
                    new: true,

                    runValidators: true
                }

            );


        if (!updatedStudent) {

            return res.status(404).json({

                message:
                    "Student not found."

            });

        }


        res.json(updatedStudent);

    }


    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// ==========================================
// DELETE - COMPLETE STUDENT RECORD
// ==========================================

app.delete("/students/:id", async (req, res) => {

    try {

        const deletedStudent =
            await Student.findByIdAndDelete(
                req.params.id
            );


        if (!deletedStudent) {

            return res.status(404).json({

                message:
                    "Student not found."

            });

        }


        res.json({

            message:
                "Complete student record deleted successfully."

        });

    }


    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// ==========================================
// CONNECT TO MONGODB
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log(
            "MongoDB connected successfully!"
        );

    })

    .catch((error) => {

        console.log(
            "MongoDB connection failed!"
        );

        console.log(error);

    });


// ==========================================
// START SERVER
// ==========================================

app.listen(3000, () => {

    console.log(
        "Server running on port 3000"
    );

});