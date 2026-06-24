output "COLA_A_URL" {
  value = aws_sqs_queue.cola_origen.url
}

output "COLA_B_URL" {
  value = aws_sqs_queue.cola_destino.url
}