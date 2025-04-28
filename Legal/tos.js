document.getElementById('downloadBtn').addEventListener('click', function() {
    var link = document.createElement('a');
    link.href = '/files/terms_of_service.pdf'; 
    link.download = 'terms_of_service.pdf';
    link.click();
  });
  