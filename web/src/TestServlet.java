import flex.messaging.io.MessageIOConstants;
import flex.messaging.io.SerializationContext;
import flex.messaging.io.amf.ActionMessage;
import flex.messaging.io.amf.AmfMessageSerializer;
import flex.messaging.io.amf.AmfTrace;
import flex.messaging.io.amf.MessageBody;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServlet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Hashtable;
import java.util.List;

@WebServlet(urlPatterns="/TestServlet")
public class TestServlet extends HttpServlet
{
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    doPost(request,response);
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    String command = request.getParameter("command");

    response.setHeader("Content-Type", "application/x-amf;charset=x-user-defined");
    ServletOutputStream out = response.getOutputStream();

    ActionMessage requestMessage = new ActionMessage(MessageIOConstants.AMF3);

    MessageBody amfMessage = new MessageBody();

    if (command.equals("getTestString"))
    {
      amfMessage.setData("testString");
    }
    else if (command.equals("getTestObject"))
    {
      TestObject testObject = new TestObject("testString", true, false, new Date(), 1.0/3.0, 1, null);
      amfMessage.setData(testObject);
    }
    else if (command.equals("getTestArrayOfObjects"))
    {
      List<TestObject> list = new ArrayList<TestObject>();

      for (int i = 0; i < 10; i++)
      {
        TestObject testObject = new TestObject("testString " + i, true, false, new Date(), 1.0/3.0, 1, null);
        list.add(testObject);
      }

      amfMessage.setData(list);
    }
    else if (command.equals("getTestHashtable"))
    {
      Hashtable<String, Object> h = new Hashtable<String, Object>();

      h.put("right_now", new Date());
      h.put("test_double", Math.PI);
      String s = "testString";
      h.put("test_string", s);
      h.put("test_string_again", s);

      TestObject testObject = new TestObject("testString", true, false, new Date(), 1.0/3.0, 1, null);
      h.put("test_object", testObject);
      h.put("test_object_again", testObject);

      amfMessage.setData(h);
    }

    requestMessage.addBody(amfMessage);

    AmfMessageSerializer amfMessageSerializer = new AmfMessageSerializer();
    amfMessageSerializer.initialize(SerializationContext.getSerializationContext(), out, new AmfTrace());
    amfMessageSerializer.writeMessage(requestMessage);

    out.close();
  }
}