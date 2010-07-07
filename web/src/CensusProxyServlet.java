import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

@WebServlet(urlPatterns="/CensusProxy")
public class CensusProxyServlet extends HttpServlet
{

  public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    doPost(request,response);
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    URL url = new URL("http://www.jamesward.com/census2-tests/servlet/CensusServiceServlet?command=getAMF3&rows=20&clientId=6F5A9CE7-802D-CC17-CA35-A4A5611BF796&testId=flex_amf3&sendCensusResultURL=http://www.jamesward.com/census2/SendCensusResult&gzip=true");

    BufferedInputStream webToProxyBuf = null;
    BufferedOutputStream proxyToClientBuf = null;
    HttpURLConnection con;

    try
    {
      int oneByte;

      con =(HttpURLConnection) url.openConnection();

      con.setDoOutput(true);
      con.setDoInput(true);
      con.setUseCaches(true);

      con.connect();

      webToProxyBuf = new BufferedInputStream(con.getInputStream());
      proxyToClientBuf = new BufferedOutputStream(response.getOutputStream());

      while ((oneByte = webToProxyBuf.read()) != -1)
      {
        proxyToClientBuf.write(oneByte);
      }

      proxyToClientBuf.flush();
      proxyToClientBuf.close();

      webToProxyBuf.close();
      con.disconnect();
    }
    catch(Exception e)
    {
      System.out.println(e.getMessage());
      e.printStackTrace();
    }
  }

}