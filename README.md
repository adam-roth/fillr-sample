# Instructions/Spec

- Edit widget.js to create a JS 'widget' module that is executed on each frame. The widget should extract the names and labels for each html form control in the document. Each frame is already configured to load the widget script from widget/widget.js.

- The top frame must collect the entire list of fields from all documents, including all descendent frames. The list of fields should be ordered by field 'name' in ascending order. See get_fields_test.js for the expected output.

- When your widget has collected all the fields from all the frames, trigger a CustomEvent on the top frame document named 'frames:loaded' with a property named 'widget' within the detail. The widget is a string with the variable name of your widget object on the window scope.  This will call window[your_object_name].getFields() and run the test.


# Basic Requirements

&nbsp;&nbsp;&nbsp;&nbsp; **&#x2713;** Only edit the widget.js file! <br />
&nbsp;&nbsp;&nbsp;&nbsp; **&#x2713;** The frame documents should not be edited. <br />
&nbsp;&nbsp;&nbsp;&nbsp; **&#x2713;** The test case should not be changed. <br />
&nbsp;&nbsp;&nbsp;&nbsp; **&#x2713;** Karma config should not be edited. <br />
&nbsp;&nbsp;&nbsp;&nbsp; **&#x2713;** The test must pass 100% of the times it is run (assuming no network errors).**\*** <br />

**\*** See assumptions


# Assumptions

* Given that the testcase is timeboxed to 10 seconds, an excessively slow page-load can be counted as a 'network error'
* Only form controls that are actually contained within a 'form' element should be scanned
* Only labels specified with a correctly structured 'label' element should be counted
* If an otherwise-valid form element doesn't have a label, then it should be ignored
* When sorting fields, a case-sensitive sort is acceptable
* Full support for older Microsoft browsers (pre-Edge) is not required
* Monitoring dynamic updates to the DOM and rescanning after the initial page load is not required (but might make a good extension)


## Questions

If you have any questions about this sample code, please contact aroth.bigtribe 'at' gmail (dot) com.
