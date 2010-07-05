import java.util.Date;

public class TestObject
{
  public TestObject(String testString, Boolean testTrue, Boolean testFalse, Date testDate, double testDouble, int testInteger, Object testNull)
  {
    this.testString = testString;
    this.testTrue = testTrue;
    this.testFalse = testFalse;
    this.testDate = testDate;
    this.testDouble = testDouble;
    this.testInteger = testInteger;
    this.testNull = testNull;
  }

  public String getTestString()
  {
    return testString;
  }

  public void setTestString(String testString)
  {
    this.testString = testString;
  }

  public Boolean getTestTrue()
  {
    return testTrue;
  }

  public void setTestTrue(Boolean testTrue)
  {
    this.testTrue = testTrue;
  }

  public Boolean getTestFalse()
  {
    return testFalse;
  }

  public void setTestFalse(Boolean testFalse)
  {
    this.testFalse = testFalse;
  }

  public Date getTestDate()
  {
    return testDate;
  }

  public void setTestDate(Date testDate)
  {
    this.testDate = testDate;
  }

  public double getTestDouble()
  {
    return testDouble;
  }

  public void setTestDouble(double testDouble)
  {
    this.testDouble = testDouble;
  }

  public int getTestInteger()
  {
    return testInteger;
  }

  public void setTestInteger(int testInteger)
  {
    this.testInteger = testInteger;
  }

  public Object getTestNull()
  {
    return testNull;
  }

  public void setTestNull(Object testNull)
  {
    this.testNull = testNull;
  }

  private String testString;
  private Boolean testTrue;
  private Boolean testFalse;
  private Date testDate;
  private double testDouble;
  private int testInteger;
  private Object testNull;

}