# Fillr Senior JS Engineer Code Test


- Edit widget.js to create a JS 'widget' module that is executed on each frame. The widget should extract the names and labels for each html form control in the document. Each frame is already configured to load the widget script from widget/widget.js.

- The top frame must collect the entire list of fields from all documents, including all descendent frames. The list of fields should be ordered by field 'name' in ascending order. See get_fields_test.js for the expected output.

- When your widget has collected all the fields from all the frames, trigger a CustomEvent on the top frame document named 'frames:loaded' with a property named 'widget' within the detail. The widget is a string with the variable name of your widget object on the window scope.  This will call window[your_object_name].getFields() and run the test.


Notes:

- Only edit the widget.js file!
- The frame documents should not be edited.
- The test case should not be changed.
- Karma config should not be edited.
- The test must pass 100% of the times it is run (assuming no network errors).

## Submission

Please submit your code test in a public github repo and notify stu@fillr.com when you are complete!