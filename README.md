# Instructions/Spec

- Edit widget.js to create a JS 'widget' module that is executed on each frame. The widget should extract the names and labels for each html form control in the document. Each frame is already configured to load the widget script from widget/widget.js.

- The top frame must collect the entire list of fields from all documents, including all descendent frames. The list of fields should be ordered by field 'name' in ascending order. See get_fields_test.js for the expected output.

- When your widget has collected all the fields from all the frames, trigger a CustomEvent on the top frame document named 'frames:loaded' with a property named 'widget' within the detail. The widget is a string with the variable name of your widget object on the window scope.  This will call window[your_object_name].getFields() and run the test.


# Basic Requirements

&nbsp;&nbsp;&nbsp;&nbsp;<b>&#x2713;</b> Only edit the widget.js file! <br />
&nbsp;&nbsp;&nbsp;&nbsp;<b>&#x2713;</b> The frame documents should not be edited. <br />
&nbsp;&nbsp;&nbsp;&nbsp;<b>&#x2713;</b> The test case should not be changed. <br />
&nbsp;&nbsp;&nbsp;&nbsp;<b>&#x2713;</b> Karma config should not be edited. <br />
&nbsp;&nbsp;&nbsp;&nbsp;<b>&#x2713;</b> The test must pass 100% of the times it is run (assuming no network errors).<b>\*</b> <br />

<b>\*</b> See assumptions


# Assumptions



## Questions

If you have any questions about this sample code, please contact aroth.bigtribe 'at' gmail (dot) com.
