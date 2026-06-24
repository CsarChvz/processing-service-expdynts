# 1. Colas SQS
resource "aws_sqs_queue" "cola_origen" {
  name = "${var.project_prefix}-cola-a-origen"
}

resource "aws_sqs_queue" "cola_destino" {
  name = "${var.project_prefix}-cola-b-destino"
}