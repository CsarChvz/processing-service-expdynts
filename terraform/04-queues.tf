
# Cola Origen (Procesos)
data "aws_sqs_queue" "cola_origen_existente" {
  name = "${variables.cola-origen}"
}

resource "aws_sqs_queue" "cola_origen" {
  count = length(data.aws_sqs_queue.cola_origen_existente.arn) > 0 ? 0 : 1
  
  name = "${variables.cola-origen}"
}

# Cola Destino (Notificaciones)

data "aws_sqs_queue" "cola_destino_existente" {
  name = "cola-destino"
}

resource "aws_sqs_queue" "cola_destino" {
  count = length(data.aws_sqs_queue.cola_destino_existente.arn) > 0 ? 0 : 1
  
  name = "cola-destino"
}
