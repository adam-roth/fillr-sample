const expect = chai.expect;

expectation = [
  { "address_line_1" : "Address Line 1" },
  { "cc_number" : "Number" },
  { "cc_type" : "Type" },
  { "country" : "Country" },
  { "first_name" : "First Name" },
  { "last_name" : "Last Name" }
];

describe('Widget #getFields', () => {

  before((done) => {
    fixture.setBase('assets');
    fixture.load('top.html');

    document.addEventListener('frames:loaded', (event) => {
      this.result = window[event.detail.widget].getFields();  
      done();  
    });
  });

  it('should extract the fields', () => {
    console.log(this.result);
    expect(this.result).to.deep.equal(expectation);
  });
});
