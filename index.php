<?php 

if( isset( $_GET['video_link'] ) ){
  $url = 'http://vidcast.dabble.me/index.html?video_link=' . urlencode( $_GET['video_link'] );
}else{
  $url = 'http://vidcast.dabble.me/';
}
$html = trim(file_get_contents( $url ));
$html = preg_replace( '/(<html>\s*<head>)/', '$1 <base href="http://vidcast.dabble.me/">', $html, 1 );
$html = preg_replace( '/action="https:\/\/vidcast.dabble.me\/index.html"/', 'action="http://q.cast/"', $html, 1 );
$html = preg_replace( '/<\/body>\s*<\/html>$/', '', $html, 1 );
echo $html;

?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://q.cast/qcast.js"></script>
  </body>
</html>
<?php /*
<!doctype html>
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
    <script type="text/javascript" src="qcast.js"></script>
  </head>
  <body>
    <form method="put" action="#">
      <br>Or enter the URL of any video/image: 
      <input name="video_link" placeholder="http://download.ted.com/talks/TimFerriss_2008P-480p.mp4" size="65" type="text">
      <input name="submit" value="Go" type="submit">
    </form>
    <iframe src=""></iframe>
  </body>
</html>
*/
